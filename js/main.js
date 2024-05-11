const canvas = document.querySelector("canvas");

class Render {

	#renderingContext;
	constructor(renderingContext) {
	 this.#renderingContext = renderingContext;
	}
	
	get renderingContext() {
		return this.#renderingContext;
	}

	clear(x,y,w,h){
		this.renderingContext.clearRect(x,y,w,h);
	}

	save(){
		this.renderingContext.save();
		}

	restore(){
		this.renderingContext.restore();
		}

	drawTrapezium(x1,y1,w1,x2,y2,w2, color="green"){
		this.drawPolygon(color, 
		x1-w1, y1,
		x1+w1, y1,
		x2+w2, y2,
		x2-w2, y2
		);
	}

	drawPolygon(color, ...coords) {
		if(coords.length > 1) {
			const renderingContext = this.renderingContext;
			renderingContext.save();
			renderingContext.fillStyle = color;
			renderingContext.beginPath();
			renderingContext.moveTo(coords[0], coords[1]);
			for (let i = 2, len=coords.length; i < len; i+=2){
				renderingContext.lineTo(coords[i], coords[(i+1) % len]);
				}
			renderingContext.closePath();			
			renderingContext.fill();
			renderingContext.restore();
		}	
	
	}
}

class Line {
	scale = 0;
	index = 0;
	#colors = {road: "", grass: "", rumble: "", strip: ""};
	points = new class {
		world = new class {
			x = 0;
			y = 0;
			z = 0;
			w = 0;
		};
		screen = new class {
			x = 0;
			y = 0;
			w = 0;
		};
	};

	get colors(){
		return this.#colors;
	}

	
	set colors(colors){
		this.#colors = colors;
	}

	/**
	 * 
	 * @param {Camera} camera 
	 */

	project(camera) {
		const { world, screen} = this.points;
		const midpoint = camera.screen.midpoint;
		camera.deltaZ = world.z - camera.z;
		const scale = this.scale = camera.distanceToProjectionPlane / camera.deltaZ;
		screen.x = Math.round((1 + (world.x - camera.x) * scale) * midpoint.x);
		screen.y = Math.round((1 - (world.y - camera.y) * scale) * midpoint.y);
		screen.w = Math.round(world.w * scale * camera.screen.width);
	}
}

class Camera {
	x = 0;
	y = 1500;
	z = 0;
	h = this.y;
	cursor = 0;
	deltaZ = 0;
	distanceToProjectionPlane = 1/Math.tan(theta);
	screen = new class {
	
		midpoint = new class {
			#screen;
			constructor(screen){
				this.#screen = screen;
			}

			get x(){
				return this.#screen.width / 2;
			}
			
			get y(){
				return this.#screen.height / 2;
			}
		}(this);

		get width() {
			return canvas.width;
		}

		get height() {
			return canvas.height;
		}
	};

	get distanceToProjectionPlane(){
		return this.distanceToProjectionPlane;
	}
	/**
	 * 
	 * @param {Road} road 
	 */
	update(road) {
		const step = road.segmentLength;
		const length = road.length;


		// Lida com o final e inicio da pista
		if(keyboard.isKeydDown("arrowUp")){
			this.cursor += step;
		}else if (keyboard.isKeydDown("arrowDown")) {
			this.cursor -= step;
		}
		if (this.cursor >= length){
			this.cursor-=length;
		}else if(this.cursor<0){
			this.cursor+=length;
			
		}
	}
}

class Player {
	x = 0;
	y = 0;
	z = 0;
}

class Road {
	/**
	 * @type {Line[]}
	 */
	#segments = [];

	#segmentLength = 200;
	#rumbleLength = 13;
	#width = 2000;

	// tamanho da zebra
	get rumbleLength() {
		return this.#rumbleLength;
	}
	//tamanho da pista
	get segmentLength() {
		return this.#segmentLength;
	}
	//quantidade de segmentos na lsita
	get segmentsLength() {
		return this.#segments.length;
	}

	//tamanho total da pista
	get length() {
		return this.segmentsLength * this.segmentLength
	}

	getSegment(cursor) {
		return this.#segments[floor(cursor / this.segmentsLength) % this.segmentsLength];
	}

	getSegmentFromIndex(index){
		return this.#segments[index % this.segmentsLength];
	}

	create(segmentsNumber=480){
		const rumbleLength = this.rumbleLength
		for(let i = 0, len = segmentsNumber + rumbleLength; i < len; i++){
			const darkColors = {road: "#222", grass: "#0F4C0F", rumble: "red", strip: ""}
			const lightColors = {road: "#222", grass: "#197F19", rumble: "white", strip: "white"}
			const line = new Line;
			line.index = i;
			line.colors = darkColors;
			
			line.colors = (Math.floor(i / rumbleLength) % 2) ? lightColors : darkColors;
			const world = line.points.world;
			world.w = this.#width;
			world.z = (i+1) * this.#segmentLength;
			this.#segments.push(line);
		}

		//Faixa final
		for (let i=0; i < rumbleLength; i++){
			this.#segments[i].colors.road = "#fff";
		}


	}

	/**
	 * 
	 * @param {Render} render 
	 * @param {Camera} camera 
	 * @param {Player} player 
	 */
	render(render, camera, player) {
		const segmentsLength = this.segmentsLength;
		const baseSegment = this.getSegment(camera.cursor);
		const startPos = baseSegment.index;
		var maxY = camera.screen.height;

		for(let i = startPos, len = 300; i < startPos+len; i++){
			const currentSegment = this.getSegmentFromIndex(i);
			
			//Verifica se o segmento atual é maior que a quantidade de segmentos e subtrai do cursor, senao subtrai 0
			camera.z = camera.cursor - (i >= segmentsLength ? this.length : 0);
			currentSegment.project(camera);
			const currentScreenPoint = currentSegment.points.screen;
			
			//so renderiza segmentos que estão aparecendo na tela
			if (currentScreenPoint.y >= maxY || camera.deltaZ <= camera.distanceToProjectionPlane){
				continue;
			}
			maxY = currentScreenPoint.y;

			if (i > 0) { 
				const previousSegment = this.getSegmentFromIndex(i - 1);
				const previousScreenPoint = previousSegment.points.screen;
				
				//renderiza apenas segmentos visiveis
				if(currentScreenPoint.y >= previousScreenPoint.y){
					continue;
				}

				const colors = currentSegment.colors;

				//road
				render.drawTrapezium(
					previousScreenPoint.x, previousScreenPoint.y, previousScreenPoint.w, 
					currentScreenPoint.x, currentScreenPoint.y, currentScreenPoint.w, 
					colors.road 
				);
				// left grass
				render.drawPolygon(
					colors.grass,
					0, previousScreenPoint.y,
					previousScreenPoint.x - previousScreenPoint.w * 1.3, previousScreenPoint.y,
					currentScreenPoint.x - currentScreenPoint.w * 1.3, currentScreenPoint.y,
					0, currentScreenPoint.y
				);

				// rigth grass
				render.drawPolygon(
					colors.grass,
					previousScreenPoint.x + previousScreenPoint.w * 1.3, previousScreenPoint.y,
					camera.screen.width, previousScreenPoint.y,
					camera.screen.width, currentScreenPoint.y,
					currentScreenPoint.x + currentScreenPoint.w * 1.3, currentScreenPoint.y,
				);

				// left rumble
				render.drawPolygon(
					colors.rumble,
					previousScreenPoint.x - previousScreenPoint.w * 1.3, previousScreenPoint.y,
					previousScreenPoint.x - previousScreenPoint.w, previousScreenPoint.y,
					currentScreenPoint.x - currentScreenPoint.w, currentScreenPoint.y,
					currentScreenPoint.x - currentScreenPoint.w *1.3, currentScreenPoint.y,
				);

				//right rumble
				render.drawPolygon(
					colors.rumble,
					previousScreenPoint.x + previousScreenPoint.w * 1.3, previousScreenPoint.y,
					previousScreenPoint.x + previousScreenPoint.w, previousScreenPoint.y,
					currentScreenPoint.x + currentScreenPoint.w, currentScreenPoint.y,
					currentScreenPoint.x + currentScreenPoint.w *1.3, currentScreenPoint.y,
				);

				//strip
				if (colors.strip) {
					const value = 2/100;
					render.drawTrapezium(
						previousScreenPoint.x, previousScreenPoint.y, previousScreenPoint.w * value,
						currentScreenPoint.x, currentScreenPoint.y, currentScreenPoint.w * value,
						colors.strip
					);
				}
				 
			}
		}
	}
}

const loop = function(time, render, camera, player, road, width, height) {
	requestAnimationFrame((time) => loop(time, render, camera, player, road, width, height));
	render.clear(0,0,width,height);
	render.save();	
	camera.update(road)
	road.render(render, camera, player);
	render.restore();

};

const init = function (time) {
	
	const render = new Render(canvas.getContext("2d"));
	const camera = new Camera();
	const player = new Player();
	const road  = new Road();
	road.create();
	camera.cursor = -road.segmentLength * road.rumbleLength
	loop(time, render, camera, player, road, canvas.width, canvas.height);

};

requestAnimationFrame((time) => init(time));
