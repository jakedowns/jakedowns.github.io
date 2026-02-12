export function setupScene({ canvas }) {
	// create Three.js scene/camera/renderer bound to provided canvas
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0a0a0a);

	const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
	camera.position.set(0, 6, 10);

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio || 1);
	renderer.setSize(Math.max(1, canvas.clientWidth || 300), Math.max(1, canvas.clientHeight || 200));

	// track core objects for reset
	const coreObjects = new Set();

	// basic lighting
	const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
	scene.add(ambient);
	coreObjects.add(ambient);

	const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
	dirLight.position.set(5, 10, 7);
	scene.add(dirLight);
	coreObjects.add(dirLight);

	// Deterministic, Roblox-portable physics implementation (semi-implicit Euler)
	const physics = {
		gravityY: -9.82,
		ground: { normal: { x: 0, y: 1, z: 0 }, height: 0, material: { name: 'groundMat', friction: 0.4, restitution: 0.0 } },
		bodies: []
	};

	function makeBoxBody(opts) {
		const b = {
			position: { x: opts.position.x, y: opts.position.y, z: opts.position.z },
			velocity: { x: 0, y: 0, z: 0 },
			halfExtents: { x: opts.halfExtents.x, y: opts.halfExtents.y, z: opts.halfExtents.z },
			mass: opts.mass || 1,
			angularDamping: opts.angularDamping || 0.5,
			userData: opts.userData || {}
		};
		physics.bodies.push(b);
		return b;
	}

	function applyImpulseToBody(body, impulse) {
		body.velocity.x += impulse.x / body.mass;
		body.velocity.y += impulse.y / body.mass;
		body.velocity.z += impulse.z / body.mass;
	}

	function applyImpulseToBox(x, z) {
		if (typeof boxBody !== 'undefined') applyImpulseToBody(boxBody, { x, y: 0, z });
	}

	function physicsStep(dt) {
		const g = physics.gravityY;
		const groundY = physics.ground.height;
		const mu = physics.ground.material.friction;
		for (const b of physics.bodies) {
			b.velocity.y += g * dt;
			b.velocity.x *= (1 - Math.min(0.5, b.angularDamping * dt));
			b.velocity.z *= (1 - Math.min(0.5, b.angularDamping * dt));
			b.position.x += b.velocity.x * dt;
			b.position.y += b.velocity.y * dt;
			b.position.z += b.velocity.z * dt;
			const bottomY = b.position.y - b.halfExtents.y;
			if (bottomY <= groundY) {
				b.position.y = groundY + b.halfExtents.y;
				if (b.velocity.y < 0) {
					b.velocity.y = -b.velocity.y * (physics.ground.material.restitution || 0);
					if (Math.abs(b.velocity.y) < 0.01) b.velocity.y = 0;
				}
				const speedHoriz = Math.sqrt(b.velocity.x * b.velocity.x + b.velocity.z * b.velocity.z);
				if (speedHoriz > 0.0001) {
					const normalForce = b.mass * Math.abs(g);
					const frictionMag = mu * normalForce * dt;
					const dv = frictionMag / b.mass;
					const nx = b.velocity.x / speedHoriz;
					const nz = b.velocity.z / speedHoriz;
					const newSpeed = Math.max(0, speedHoriz - dv);
					b.velocity.x = nx * newSpeed;
					b.velocity.z = nz * newSpeed;
				} else {
					b.velocity.x = 0;
					b.velocity.z = 0;
				}
			}
		}
	}

	// ground visual
	const groundGeo = new THREE.PlaneGeometry(40, 40);
	const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
	const groundMesh = new THREE.Mesh(groundGeo, groundMat);
	groundMesh.rotation.x = -Math.PI / 2;
	scene.add(groundMesh);
	coreObjects.add(groundMesh);

	// box visual + physics body
	const boxGeo = new THREE.BoxGeometry(1, 1, 1);
	const boxMatMesh = new THREE.MeshStandardMaterial({ color: 0x88aaff });
	const boxMesh = new THREE.Mesh(boxGeo, boxMatMesh);
	boxMesh.castShadow = true;
	scene.add(boxMesh);
	coreObjects.add(boxMesh);
	const boxBody = makeBoxBody({ position: { x: 0, y: 3, z: 0 }, halfExtents: { x: 0.5, y: 0.5, z: 0.5 }, mass: 1, angularDamping: 0.5 });

	// helper: dispose object graph
	function disposeObject(obj) {
		try {
			if (obj.geometry) { obj.geometry.dispose && obj.geometry.dispose(); }
			if (obj.material) {
				const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
				for (const m of mats) {
					if (m.map) { m.map.dispose && m.map.dispose(); }
					if (m.dispose) m.dispose();
				}
			}
			if (obj.children && obj.children.length) {
				for (const c of obj.children.slice()) {
					disposeObject(c);
					obj.remove(c);
				}
			}
		} catch (e) { /* ignore disposal errors */ }
	}

	// resize helper
	function resize() {
		try {
			if (!renderer || !canvas || !camera) return;
			const width = Math.max(1, canvas.clientWidth || 300);
			const height = Math.max(1, canvas.clientHeight || 200);
			renderer.setSize(width, height, false);
			if (camera && typeof camera.aspect === 'number') {
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
			}
		} catch (e) { /* ignore */ }
	}

	// main loop
	let last = performance.now();
	let animRunning = false;
	function animate(now) {
		resize();
		const dt = Math.min(1 / 30, (now - last) / 1000);
		last = now;
		physicsStep(dt);
		// sync visuals for box
		boxMesh.position.set(boxBody.position.x, boxBody.position.y, boxBody.position.z);
		// user update hook (if any) - uses global userUpdate if set by app scripts
		if (typeof window.userUpdate === 'function') {
			try { window.userUpdate(dt, window.keysDown || {}); } catch (e) { console.error('user update error', e); }
		}
		if (renderer && camera) renderer.render(scene, camera);
		if (animRunning) requestAnimationFrame(animate);
	}

	function startAnimation() {
		if (animRunning) return;
		animRunning = true;
		last = performance.now();
		requestAnimationFrame(animate);
	}

	function stopAnimation() {
		animRunning = false;
	}

	// expose scene to window for compatibility with existing inline code
	try { window.scene = scene; } catch (e) { /* ignore */ }

	return {
		scene, camera, renderer, physics,
		makeBoxBody, applyImpulseToBody, applyImpulseToBox,
		boxMesh, boxBody, groundMesh, coreObjects,
		disposeObject, startAnimation, stopAnimation
	};
}
