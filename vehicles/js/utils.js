export function debounce(fn, ms = 100) {
	let t = null;
	return function (...args) {
		if (t) clearTimeout(t);
		const ctx = this;
		t = setTimeout(() => {
			t = null;
			try { fn.apply(ctx, args); } catch (e) { console.error('debounce wrapper error', e); }
		}, ms);
	};
}
