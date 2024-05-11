
//Declaração de constantes
const {tan , round, PI, floor} = Math;
const fov = 120 / 180 * PI;
const theta = fov * 0.5;

const keyboard = new class {
	
	#map = {};

	constructor() {
		window.addEventListener("keydown", (evt)=>this.#handler(evt));
		window.addEventListener("keyup", (evt)=>this.#handler(evt));
		}


	/**
		*
		*
		*@param {KeyboardEvent} evt
		*
		*/
		

	#handler(evt) {
		const key = evt.key.toLowerCase();
		//console.log(key);
		this.#map[key] = evt.type === "keydown";
		}


	isKeydDown(key){
		return !!this.#map[key.toLowerCase()];
		}
	


}
