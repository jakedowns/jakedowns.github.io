// Hello world / visual test for Three.js inside the editor.
// Adds a cube, lights, sky color, and a checkerboard floor texture.

console.log('[template-003-hello] loaded');

(() => {
	// change background (sky)
	try { scene.background = new THREE.Color(0x87ceeb); } catch(e){}

	// ambient + directional light
	const amb = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(amb);
	const dir = new THREE.DirectionalLight(0xffffff, 0.8);
	dir.position.set(5, 10, 7);
	scene.add(dir);

	// Checkerboard floor texture (canvas)
	function makeCheckerTexture(size = 512, squares = 8) {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		const sq = size / squares;
		for (let y = 0; y < squares; y++) {
			for (let x = 0; x < squares; x++) {
				ctx.fillStyle = ((x + y) % 2 === 0) ? '#444' : '#ddd';
				ctx.fillRect(x * sq, y * sq, sq, sq);
			}
		}
		const tex = new THREE.CanvasTexture(canvas);
		tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
		tex.repeat.set(1, 1);
		return tex;
	}

	const floorMat = new THREE.MeshStandardMaterial({ map: makeCheckerTexture(), metalness: 0.0, roughness: 1.0 });
	const floorGeo = new THREE.PlaneGeometry(40, 40);
	const floor = new THREE.Mesh(floorGeo, floorMat);
	floor.rotation.x = -Math.PI / 2;
	floor.position.y = 0;
	scene.add(floor);

	// Add a cube (visual only for this template)
	const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
	const cubeMat = new THREE.MeshStandardMaterial({ color: 0x88ff88 });
	const cube = new THREE.Mesh(cubeGeo, cubeMat);
	cube.position.set(0, 1, 0);
	scene.add(cube);

	console.log('[template-003-hello] added cube, lights and checker floor');

	// Simple update to rotate cube slowly so you can see scene is active
	let _first = true;
	registerUpdate((dt: number) => {
		if (_first) {
			_first = false;
			console.log('[template-003-hello] update started');
		}
		cube.rotation.y += dt * 0.6;
		cube.position.y = 1 + Math.sin(performance.now() * 0.002) * 0.05; // tiny bob
	});
})();
