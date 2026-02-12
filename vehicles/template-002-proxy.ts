console.log('[template-002-proxy] loaded');

((): void => {
	// proxy visuals
	const proxyGeo = new THREE.SphereGeometry(0.4, 12, 12);
	const proxyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, transparent: true, opacity: 0.45, emissive: 0x442200 });
	const proxy = new THREE.Mesh(proxyGeo, proxyMat);
	proxy.position.set(0, 1.5, -3);
	scene.add(proxy);

	console.log('[template-002-proxy] proxy created at', proxy.position);

	// expose so resetScene can find and reset it
	(window as any).sceneProxy = proxy;

	let t = 0;
	const proxySpeed = 4.0;
	const followForce = 80.0; // impulse magnitude
	const maxFollowSpeed = 8.0;
	const hoverAmp = 0.12;
	const hoverFreq = 2.2;
	const rollFreq = 3.2;
	const rollAmp = 0.28;

	// helper horizontal distance
	function horizDist(ax:number, az:number, bx:number, bz:number) {
		const dx = ax - bx;
		const dz = az - bz;
		return Math.sqrt(dx*dx + dz*dz);
	}

	let _proxy_first = true;
	registerUpdate((dt:number, keys:any) => {
		if (_proxy_first) { _proxy_first = false; console.log('[template-002-proxy] update loop started'); }
		t += dt;
		// move proxy by input
		let ix = 0, iz = 0;
		if (keys.w || keys.ArrowUp) iz -= 1;
		if (keys.s || keys.ArrowDown) iz += 1;
		if (keys.a || keys.ArrowLeft) ix -= 1;
		if (keys.d || keys.ArrowRight) ix += 1;

		// simple normalization
		const mag = Math.hypot(ix, iz) || 0;
		if (mag > 0.001) {
			proxy.position.x += (ix / mag) * proxySpeed * dt;
			proxy.position.z += (iz / mag) * proxySpeed * dt;
		}

		// bob the proxy a bit
		proxy.position.y = 1.5 + Math.sin(t * (hoverFreq * 0.8)) * (hoverAmp * 0.9);

		// compute horizontal vector to proxy
		const dx = proxy.position.x - boxBody.position.x;
		const dz = proxy.position.z - boxBody.position.z;
		const dist = Math.hypot(dx, dz);

		if (dist > 0.05) {
			// unit direction
			const ux = dx / dist;
			const uz = dz / dist;
			// impulse scaled by dt for stability
			const impulse = followForce * dt;
			applyImpulseToBox(ux * impulse, uz * impulse);
		}

		// simple speed clamp on horizontal velocity
		const hv = Math.hypot(boxBody.velocity.x, boxBody.velocity.z);
		if (hv > maxFollowSpeed) {
			const nx = boxBody.velocity.x / hv;
			const nz = boxBody.velocity.z / hv;
			boxBody.velocity.x = nx * maxFollowSpeed;
			boxBody.velocity.z = nz * maxFollowSpeed;
		}

		// Visual hover bob and rolling motion applied to mesh (userUpdate runs after physics sync)
		// Keep the physics-driven y but add a small visual offset for hover.
		const bob = Math.sin(t * hoverFreq) * hoverAmp;
		boxMesh.position.y = boxBody.position.y + bob;
		// rolling: lean left/right as if balancing while moving
		boxMesh.rotation.z = Math.sin(t * rollFreq) * rollAmp;
	});
})();
