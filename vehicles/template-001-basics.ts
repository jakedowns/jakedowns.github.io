// Basic "car" controls for the cube: steer + throttle. Uses registerUpdate and applyImpulseToBox.
// Designed to be portable to Roblox Lua by porting the same math and update logic.

let heading = 0; // radians; 0 = forward along negative Z
const steerSpeed = Math.PI; // rad/s turn rate
const accel = 40; // impulse magnitude per second when throttling
const maxSpeed = 10; // clamp horizontal speed
const handBrakeFactor = 0.5; // reduces lateral sliding when braking

// Helper: get horizontal speed magnitude
function horizSpeed(b:any) {
	return Math.sqrt(b.velocity.x*b.velocity.x + b.velocity.z*b.velocity.z);
}

// Update loop: dt seconds, keys is sceneApi.keys
registerUpdate((dt:number, keys:any) => {
	const k = keys;
	// steering
	if (k.a || k.ArrowLeft) heading -= steerSpeed * dt;
	if (k.d || k.ArrowRight) heading += steerSpeed * dt;

	// throttle
	let throttle = 0;
	if (k.w || k.ArrowUp) throttle = 1;
	if (k.s || k.ArrowDown) throttle = -1;

	// compute forward vector (0 heading => -Z forward)
	const fx = Math.sin(heading);
	const fz = -Math.cos(heading);

	// apply impulse proportional to dt so behavior is framerate independent
	if (throttle !== 0) {
		const impulse = accel * throttle * dt;
		applyImpulseToBox(fx * impulse, fz * impulse);
	}

	// simple speed clamp (horizontal)
	const s = horizSpeed(boxBody);
	if (s > maxSpeed) {
		const nx = boxBody.velocity.x / s;
		const nz = boxBody.velocity.z / s;
		boxBody.velocity.x = nx * maxSpeed;
		boxBody.velocity.z = nz * maxSpeed;
	}

	// simple directional damping to reduce unwanted sliding:
	// if braking (pressing S / ArrowDown) apply more lateral dampening
	if (k.s || k.ArrowDown) {
		boxBody.velocity.x *= (1 - Math.min(0.9, handBrakeFactor * dt));
		boxBody.velocity.z *= (1 - Math.min(0.9, handBrakeFactor * dt));
	}
});
