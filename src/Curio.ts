function curio(name: string) {
	return `{{Item|${name}|20|type=Curio|link=Simulated_Universe/Curio#${name.replace(/ /g, '_')}}}`
}

export class CurioGroup {
	// name: string = ''

	// static forId(id: number): CurioGroup {
	// 	return this // TODO
	// }

	static nameForId(id: number, plural?: boolean): string {
		const s = plural ? 's' : plural === false ? '' : '(s)'
		switch (id) {
			case 10001:
			case 10002:
			case 20002:
			case 10010:
			case 21011:
			case 21012:
			case 12000:
			case 22000:
			case 30010:
				return `Normal Curio${s}`
			
			case 10003:
			case 20003:
				return `Negative Curio${s}`
			
			case 10004:
			case 20004:
			case 30004:
			case 30012:
				return `Curio${s}`
			
			case 11042:
			case 20005:
				return `Error Code Curio${s}`
			
			case 10009:
			case 20009:
				return `Negative Curio${s} of the cuckoo clock series`
			
			case 11012:
			case 21009:
			case 32060:
				return `Curio${s} of the Big Lotto series`
			
			case 11009:
			case 21002:
				return `Curio<nowiki>:</nowiki> ${curio('Angel-type I.O.U. Dispenser')}`
			
			case 11010:
			case 21003:
				return `Negative Curio<nowiki>:</nowiki> ${curio('Insect Web')}`
			
			case 11013:
			case 21010:
				return `Curio<nowiki>:</nowiki> ${curio('Cavity System Model')}`
			
			case 11015:
			case 21007:
				return `Curio<nowiki>:</nowiki> ${curio('The Pinkest Collision')}`
			
			case 11014:
			case 21006:
				return `Curio<nowiki>:</nowiki> ${curio('Thalan Toxi-Flame')}`
			
			case 11016:
			case 21008:
				return `Curio${s}<nowiki>:</nowiki> ${curio('The Pinkest Collision')} ${plural ? 'and' : 'or'} ${curio('Thalan Toxi-Flame')}`
			
			case 21004:
				return `Curio<nowiki>:</nowiki> ${curio('Tonic of Efficacious Chaos')}`
			
			case 31004:
				return `Curio<nowiki>:</nowiki> ${curio('Fruit of the Alien Tree')}`
			
			case 31005:
				return `Curio<nowiki>:</nowiki> ${curio('Casket of Inaccuracy')}`
			
			case 31006:
				return `Curio<nowiki>:</nowiki> ${curio('Ambergris Cheese')}`
			
			case 32030:
				return `Curios<nowiki>:</nowiki> ${curio('Ambergris Cheese')}, ${curio('Casket of Inaccuracy')}, ${plural ? 'and' : 'or'} ${curio('Fruit of the Alien Tree')}`

			case 31208:
				return `Curio<nowiki>:</nowiki> ${curio('Mysterious Magnetism')}`
			
			case 31209:
				return `Curio<nowiki>:</nowiki> ${curio('Organic Heart')}`
			
			case 31207:
				return `Curio<nowiki>:</nowiki> ${curio('King of Sponges')}`

			case 31205:
				return `Curio<nowiki>:</nowiki> ${curio('Indecipherable Box')}`
				
			case 31206:
				return `Curio<nowiki>:</nowiki> ${curio('Rotting Fruit of the Alien Tree')}`
			
			case 20008:
			case 30008:
				return `Damageable Curio${s}`
			
			case 32070:
				return `Curios<nowiki>:</nowiki> ${curio('Gold Coin of Discord')} ${plural ? 'and' : 'or'} ${curio('Typical Genius Society Gossip')}`
		}
		
		return `Curio${s}<nowiki>:</nowiki> {{tx}}<!--ID: ${id}-->`
	}
}