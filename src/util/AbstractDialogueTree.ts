
export interface DialogueNode<T> {
	item: T
	children?: DialogueNode<T | TranscriptionNote>[]
	next?: DialogueNode<T | TranscriptionNote>
	prev?: DialogueNode<T | TranscriptionNote>
	parent?: DialogueNode<T | TranscriptionNote>
	clone?: DialogueNode<T>
	_optimized?: boolean
}

export class TranscriptionNote {
	constructor(public id: string, public text?: string) {}
	
	equals(obj2: any) {
		return obj2 instanceof TranscriptionNote && this.id == obj2.id && this.id != 'custom-string-loop'
	}
	
	wikitext() {
		return this.text ? `;(${this.text})` : undefined
	}
}

export interface AbstractDialogueNodeItem {
	equals(obj2: AbstractDialogueNodeItem): boolean
	wikitext(indent: number, tree: AbstractDialogueTree<this>, node: DialogueNode<this>): (string | undefined | Promise<string | undefined>)
	entries?: this[]
}

export abstract class AbstractDialogueTree<T extends AbstractDialogueNodeItem> {
	root?: DialogueNode<T>
	abstract type: string
	
	constructor(public debug_id?: string) {}
	
	async setRoot(root: T | T[]) {
		if (Array.isArray(root)) {
			if (root.length > 1) {
				const pseudoRoot = this.root = {
					item: undefined,
				} as any
				pseudoRoot.children = root.map(root => this.makeNode(root, pseudoRoot, true))
			} else {
				this.root = await this.makeNode(root[0])
			}
		} else if (root) {
			this.root = await this.makeNode(root)
		}
	}
	
	async makeNode(item: undefined, prev?: DialogueNode<T>, prevIsParent?: boolean): Promise<undefined>
	async makeNode(item: T, prev?: DialogueNode<T>, prevIsParent?: boolean): Promise<DialogueNode<T>>
	async makeNode(item?: T, prev?: DialogueNode<T>, prevIsParent?: boolean): Promise<DialogueNode<T> | undefined> {
		if (!item) return undefined
		
		const newNode: DialogueNode<T> = {
			item,
			children: undefined,
			next: undefined,
			prev: prevIsParent ? undefined : prev,
			parent: prevIsParent ? prev : undefined,
		}
		
		const nextItems = this.getNext(item)
		const nextNodes: DialogueNode<T>[] = []
		for (const n of nextItems) {
			nextNodes.push(await this.makeNode(n, newNode, nextItems.length > 1))
		}
		
		if (nextNodes.length > 1) {
			newNode.children = nextNodes
		} else {
			newNode.next = nextNodes[0]
		}

		this.nodeAdded(newNode)
		
		return newNode
	}
	
	async makeNodesFromList(items: T[], prev?: DialogueNode<T>): Promise<DialogueNode<T>> {
		let currentNode = prev
		
		for (const item of items) {
			let prevNode = currentNode
			currentNode = {
				item,
				children: undefined,
				next: undefined,
				prev: prevNode,
				// parent: prevIsParent ? prev : undefined,
			}
			if (prevNode) prevNode.next = currentNode
			if (item.entries?.length) {
				currentNode = currentNode.next = await this.makeNodesFromList(item.entries, currentNode)
			}
			this.nodeAdded(currentNode)
		}

		return currentNode!
	}
	
	nodeAdded(node: DialogueNode<T>): any {
		// placeholder
	}
	
	optimize(threadRoots: DialogueNode<T | TranscriptionNote>[] = [this.root!]): this {
		for (let currentNode of threadRoots) {
			while (currentNode) {
				if (currentNode.children) {
					this.optimize(currentNode.children)
				}
				currentNode = currentNode.next!
			}
		}
		
		if (threadRoots.length > 1) {
			let currentNode = threadRoots[0]
			const otherThreads = threadRoots.slice(1)
			while (currentNode) {
				const isResumption = !otherThreads.find(thread => !this.find(thread, n => 
					currentNode.item?.equals(n.item) 
					&& this.verifySamePath(currentNode, n)
				))
				
				if (isResumption) {
					for (const thread of threadRoots) {
						const match = this.find(thread, currentNode.item)
						if (!match?.prev) continue
						match.prev.next = undefined
						this.onNodeOrphaned(match)
					}
					
					currentNode.prev = threadRoots[0].parent
					threadRoots[0].parent!.next = currentNode
					currentNode._optimized = true
					
					break
				}
				
				let isConsecutiveChoice = false
				if (currentNode.children?.length) {
					isConsecutiveChoice = !otherThreads.find(thread => !this.findFork(thread, currentNode.children!))

					if (isConsecutiveChoice) {
						for (const thread of otherThreads) {
							this.findFork(thread, currentNode.children!)!.children = undefined
						}

						const note = new TranscriptionNote('consecutive-choice', 'All choices lead to the following options')
						const noteNode: DialogueNode<T | TranscriptionNote> = {
							item: note,
							children: currentNode.children,
							prev: threadRoots[0].parent,
							next: currentNode.next ?? threadRoots[0].parent!.next
						}
						for (const child of currentNode.children) {
							child.parent = noteNode
						}
						currentNode.children = undefined
						currentNode.next = undefined

						if (threadRoots[0].parent?.next) {
							threadRoots[0].parent.next.prev = noteNode
						}
						threadRoots[0].parent!.next = noteNode
						this.onNodeOrphaned(threadRoots[0])
						
						break
					}
				}
				
				currentNode = currentNode.next!
			}
		}
		
		return this
	}
	
	find(node: DialogueNode<T | TranscriptionNote>, needle: T | TranscriptionNote | ((node: DialogueNode<T | TranscriptionNote>) => unknown)): DialogueNode<T | TranscriptionNote> | undefined {
		const compare = typeof needle == 'function' ? needle : (n => this.entriesEqual(n.item, needle))
		
		while (node) {
			if (compare(node)) {
				return node
			}
			node = node.next!
		}
		return undefined
	}
	
	verifySamePath(node1: DialogueNode<T | TranscriptionNote>, node2: DialogueNode<T | TranscriptionNote>) {
		while (node1 && node2) {
			if (node1.item != node2.item && !node1?.item.equals(node2?.item)) return false
			if (!node1.next && !node2.next) return true
			else if (!node1.next || !node2.next) return false
			
			node1 = node1.next
			node2 = node2.next
		}
		return true
	}

	findFork(node: DialogueNode<T | TranscriptionNote>, children: DialogueNode<T | TranscriptionNote>[]): DialogueNode<T | TranscriptionNote> | undefined {
		return this.find(node, node => node.children?.length == children.length && node.children.every((child, i) => this.entriesEqual(child.item, children[i].item)))
	}
	
	onNodeOrphaned(node: DialogueNode<T | TranscriptionNote>) {
		// placeholder
	}
	
	inverseFind(node: DialogueNode<T | TranscriptionNote>, compare: ((node: DialogueNode<T | TranscriptionNote>) => unknown)) {
		while (node) {
			if (compare(node)) {
				return node
			}
			node = node.prev ?? node.parent!
		}
		return undefined
	}

	deepFind(node: DialogueNode<T | TranscriptionNote>, compare: ((node: DialogueNode<T | TranscriptionNote>) => unknown)) {
		while (node) {
			if (compare(node)) {
				return node
			}
			if (node.children?.length) {
				for (const child of node.children) {
					const found = this.deepFind(child, compare)
					if (found) return found
				}
			}
			node = node.next!
		}
		return undefined
	}
	
	indent(level: number) {
		return ':'.repeat(level)
	}
	
	async wikitextFrom(node: DialogueNode<T | TranscriptionNote>, level: number): Promise<string> {
		const output: string[] = []
		let isFirst = level > 0
		
		while (node) {
			if (node.item) {
				const wt = await node.item.wikitext(level, this, node as any)
				if (wt != undefined) {
					output.push(this.indent(isFirst ? level - 1 : level) + wt)
					isFirst = false
				}
			}
			
			if (node.children?.length) {
				for (const child of node.children) {
					const wtFrom = await this.wikitextFrom(child, level + 1)
					if (wtFrom != undefined && wtFrom.trim() != '') {
						output.push(wtFrom)
					}
				}
			}
			
			node = node.next!
		}
		
		return output.join('\n')
	}

	async wikitext() {
		return await this.wikitextFrom(this.root!, 0)
	}

	list(current: DialogueNode<T | TranscriptionNote>, nodes: true): DialogueNode<T | TranscriptionNote>[]
	list(current?: DialogueNode<T | TranscriptionNote>, nodes?: false): (T | TranscriptionNote)[]
	list(current?: DialogueNode<T | TranscriptionNote>, nodes?: boolean): (T | TranscriptionNote | DialogueNode<T | TranscriptionNote>)[]
	list(current: DialogueNode<T | TranscriptionNote> = this.root!, nodes?: boolean) {
		const list: (T | TranscriptionNote | DialogueNode<T | TranscriptionNote>)[] = []
		while (current) {
			if (nodes || current.item) {
				list.push(nodes ? current : current.item)
			}
			if (current.children) {
				for (const child of current.children) {
					list.push(...this.list(child, nodes))
				}
			}
			current = current.next!
		}
		return list
	}
	
	clone<N extends T | TranscriptionNote>(node: DialogueNode<N>, prev?: DialogueNode<N | TranscriptionNote>, isParent?: boolean): DialogueNode<N> {
		const newNode: DialogueNode<N> = {
			item: node.item,
			prev: isParent ? undefined : prev,
			parent: isParent ? prev : undefined,
			clone: node,
		}
		
		newNode.next = node.next ? this.clone(node.next, newNode, false) : undefined
		newNode.children = node.children?.map(child => this.clone(child, newNode, true))
		
		return newNode
	}
	
	getRootOf(node: DialogueNode<T | TranscriptionNote>) {
		while (node.prev ?? node.parent) {
			node = node.prev ?? node.parent!
		}
		return node
	}
	
	getEndOf(node: DialogueNode<T | TranscriptionNote>) {
		while (node.next) {
			node = node.next
		}
		return node
	}
	
	getParentOf(node: DialogueNode<T | TranscriptionNote>) {
		while (node.prev && !node.parent) {
			node = node.prev!
		}
		return node.parent
	}
	
	entriesEqual(entry0: T | TranscriptionNote, entry1: T | TranscriptionNote): boolean {
		return entry0.equals(entry1)
	}
	
	abstract getNext(item: T): T[]
}