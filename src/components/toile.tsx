import { useCallback, useEffect, useRef, useState } from 'react';

type Photo = { file: string; w: number; h: number; alt: string };

// Dimensions réelles des fichiers : chaque photo est affichée dans une boîte
// à son ratio exact, jamais recadrée ni déformée.
const PHOTOS: Photo[] = [
	{ file: '17-longboard.jpg', w: 2400, h: 1600, alt: 'Longboardeur debout sur sa planche au coucher du soleil' },
	{ file: '16-tube.jpg', w: 2400, h: 1600, alt: 'Surfeur dans le tube, contre-jour, noir et blanc' },
	{ file: '07-chute.jpg', w: 1920, h: 2400, alt: 'Surfeur accroupi sur une vague immense, noir et blanc' },
	{ file: '18-soleil.jpg', w: 1600, h: 2400, alt: "Silhouette d'un surfeur sous un soleil couchant orangé" },
	{ file: '04-carve.jpg', w: 2400, h: 1601, alt: 'Surfeur en plein virage sur une vague verte' },
	{ file: '02-envol.jpg', w: 1800, h: 2400, alt: "Surfeur en l'air, contre-jour bleu clair" },
	{ file: '09-glisse.jpg', w: 2400, h: 1601, alt: 'Surfeur en glisse sur une vague turquoise' },
	{ file: '11-contrejour.jpg', w: 1600, h: 2400, alt: 'Surfeur à contre-jour doré, éclaboussures' },
	{ file: '05-rame.jpg', w: 2400, h: 1599, alt: 'Surfeur qui rame, plan large noir et blanc' },
	{ file: '13-rire.jpg', w: 1800, h: 2400, alt: 'Portrait rapproché, rire, noir et blanc' },
	{ file: '14-visee.jpg', w: 2400, h: 1601, alt: "Surfeur tenant une caméra devant l'œil, profil" },
	{ file: '10-reprise.jpg', w: 1920, h: 2400, alt: 'Surfeur en glisse, ciel pâle, combinaison bordeaux' },
	{ file: '03-fart.jpg', w: 2400, h: 1800, alt: 'Mains fartant une planche de surf, noir et blanc' },
	{ file: '12-entree.jpg', w: 1800, h: 2400, alt: 'Surfeur prenant une vague, plan large noir et blanc' },
	{ file: '01-ecume.jpg', w: 1800, h: 2400, alt: "Éclaboussure d'eau en gros plan, tons sépia" },
	{ file: '06-marche.jpg', w: 1601, h: 2400, alt: 'Silhouette marchant vers la mer, plage à marée basse' },
	{ file: '08-gerbe.jpg', w: 1920, h: 2400, alt: "Gros plan sur une gerbe d'eau, noir et blanc" },
	{ file: '15-crepuscule.jpg', w: 1601, h: 2400, alt: "Silhouette dans l'eau face au soleil couchant" },
];

const thumb = (p: Photo) => `/images/m/${p.file}`;
const full = (p: Photo) => `/images/${p.file}`;

// La toile est une grille 5 × 4 : les 18 photos, plus une case pour le nom
// et une pour la phrase.
type Cell = { kind: 'photo'; index: number } | { kind: 'name' } | { kind: 'text' };

const COLS = 5;
const NAME_CELL = 6;
const TEXT_CELL = 13;
const CELLS: Cell[] = (() => {
	const cells: Cell[] = [];
	let k = 0;
	for (let c = 0; c < PHOTOS.length + 2; c++) {
		if (c === NAME_CELL) cells.push({ kind: 'name' });
		else if (c === TEXT_CELL) cells.push({ kind: 'text' });
		else cells.push({ kind: 'photo', index: k++ });
	}
	return cells;
})();
const ROWS = Math.ceil(CELLS.length / COLS);

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pad = (n: number) => String(n).padStart(2, '0');

const chip =
	'inline-flex min-h-[34px] items-center rounded-full border-[1.5px] border-white bg-[#0d0d0d] px-3.5 text-xs font-medium tracking-[0.04em] whitespace-nowrap text-white uppercase';
const chipLink = `${chip} pointer-events-auto transition-colors hover:bg-white hover:text-[#0d0d0d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a1c]`;

type Item = { el: HTMLElement; x: number; y: number; w: number; h: number };

export default function Toile() {
	const stageRef = useRef<HTMLDivElement>(null);
	const cellRefs = useRef<(HTMLElement | null)[]>([]);
	const [open, setOpen] = useState<number | null>(null);
	const openRef = useRef(false);

	useEffect(() => {
		openRef.current = open !== null;
	}, [open]);

	const close = useCallback(() => setOpen(null), []);
	const nav = useCallback((dir: number) => {
		setOpen((i) => (i === null ? i : mod(i + dir, PHOTOS.length)));
	}, []);

	useEffect(() => {
		const stage = stageRef.current;
		if (!stage) return;

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const s = { x: 0, y: 0, vx: 0, vy: 0, pw: 1, ph: 1, mx: 0, my: 0 };
		let items: Item[] = [];
		let drag: { x: number; y: number; ox: number; oy: number; lx: number; ly: number; lt: number } | null = null;
		let moved = false;
		let placed = false;
		let raf = 0;
		let last = performance.now();

		const render = () => {
			for (const it of items) {
				const sx = mod(it.x + s.x + s.mx, s.pw) - s.mx;
				const sy = mod(it.y + s.y + s.my, s.ph) - s.my;
				it.el.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
			}
		};

		const layout = () => {
			const W = stage.clientWidth;
			const H = stage.clientHeight;
			if (!W || !H) return;
			const small = W < 700;
			const bw = small ? 260 : 480;
			const bh = small ? 290 : 500;

			let mw = 0;
			let mh = 0;
			const sizes = CELLS.map((cell, c): [number, number] => {
				const el = cellRefs.current[c];
				if (!el) return [0, 0];
				let w: number;
				let h: number;
				if (cell.kind === 'photo') {
					// même surface pour toutes les photos, quel que soit leur format
					const r = PHOTOS[cell.index].w / PHOTOS[cell.index].h;
					const base = Math.min(bw, bh) * 0.8;
					w = base * Math.sqrt(r);
					h = base / Math.sqrt(r);
					el.style.width = `${w.toFixed(1)}px`;
					el.style.height = `${h.toFixed(1)}px`;
				} else {
					if (cell.kind === 'name') {
						el.style.fontSize = `${(bw * 0.13).toFixed(1)}px`;
					} else {
						el.style.fontSize = `${(bw * 0.075).toFixed(1)}px`;
						el.style.width = `${(bw * 0.86).toFixed(0)}px`;
					}
					w = el.offsetWidth;
					h = el.offsetHeight;
				}
				mw = Math.max(mw, w);
				mh = Math.max(mh, h);
				return [w, h];
			});

			// La toile dépasse l'écran d'au moins un élément : le rebouclage se
			// fait toujours hors champ.
			s.mx = mw + 60;
			s.my = mh + 60;
			const cw = Math.max(bw, (W + s.mx + 40) / COLS);
			const ch = Math.max(bh, (H + s.my + 40) / ROWS);
			s.pw = cw * COLS;
			s.ph = ch * ROWS;

			items = [];
			CELLS.forEach((_, c) => {
				const el = cellRefs.current[c];
				if (!el) return;
				const [w, h] = sizes[c];
				const col = c % COLS;
				const row = Math.floor(c / COLS);
				const jx = ((((c * 37) % 11) - 5) / 5) * cw * 0.07;
				const jy = ((((c * 53) % 9) - 4) / 4) * ch * 0.08;
				items.push({ el, x: (col + 0.5) * cw + jx - w / 2, y: (row + 0.5) * ch + jy - h / 2, w, h });
			});

			// À l'arrivée, le nom est au centre de l'écran.
			const name = items.find((it) => it.el === cellRefs.current[NAME_CELL]);
			if (!placed && name) {
				placed = true;
				s.x = W / 2 - (name.x + name.w / 2);
				s.y = H / 2 - (name.y + name.h / 2);
			}
			render();
		};

		const tick = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			if (!drag) {
				s.x += s.vx * dt;
				s.y += s.vy * dt;
				const k = Math.pow(0.94, dt * 60);
				s.vx *= k;
				s.vy *= k;
				// dérive lente tant que personne ne touche à rien
				const idle = Math.abs(s.vx) + Math.abs(s.vy) < 6;
				const focused = stage.querySelector('[data-i]:focus-visible') !== null;
				if (!reduce && !openRef.current && !focused && idle) {
					s.x -= 18 * dt;
					s.y -= 7 * dt;
				}
			}
			render();
			raf = requestAnimationFrame(tick);
		};

		const tileAt = (target: EventTarget | null) =>
			target instanceof Element ? target.closest<HTMLElement>('[data-i]') : null;

		const onPointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			const now = performance.now();
			drag = { x: e.clientX, y: e.clientY, ox: s.x, oy: s.y, lx: e.clientX, ly: e.clientY, lt: now };
			moved = false;
			s.vx = 0;
			s.vy = 0;
			stage.setPointerCapture(e.pointerId);
			stage.classList.add('cursor-grabbing');
		};
		const onPointerMove = (e: PointerEvent) => {
			if (!drag) return;
			const dx = e.clientX - drag.x;
			const dy = e.clientY - drag.y;
			if (Math.hypot(dx, dy) > 5) moved = true;
			s.x = drag.ox + dx;
			s.y = drag.oy + dy;
			render();
			const now = performance.now();
			const dt = (now - drag.lt) / 1000;
			if (dt > 0.008) {
				s.vx = (e.clientX - drag.lx) / dt;
				s.vy = (e.clientY - drag.ly) / dt;
				drag.lx = e.clientX;
				drag.ly = e.clientY;
				drag.lt = now;
			}
		};
		const endDrag = () => {
			if (!drag) return;
			drag = null;
			stage.classList.remove('cursor-grabbing');
			if (moved) {
				s.vx = clamp(s.vx, -2600, 2600);
				s.vy = clamp(s.vy, -2600, 2600);
			} else {
				s.vx = 0;
				s.vy = 0;
			}
		};
		// Un clic sans déplacement agrandit la photo ; au clavier, Entrée fait de même.
		const onClick = (e: MouseEvent) => {
			const tile =
				e.detail === 0 ? tileAt(e.target) : moved ? null : tileAt(document.elementFromPoint(e.clientX, e.clientY));
			if (tile) setOpen(Number(tile.dataset.i));
		};
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			s.x -= e.deltaX;
			s.y -= e.deltaY;
			render();
		};
		const onKey = (e: KeyboardEvent) => {
			if (openRef.current) return;
			const ax = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
			const ay = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
			if (!ax && !ay) return;
			e.preventDefault();
			s.vx -= ax * 900;
			s.vy -= ay * 900;
		};
		// Au clavier, la photo qui reçoit le focus vient se placer au centre.
		const onFocusIn = (e: FocusEvent) => {
			const tile = tileAt(e.target);
			if (!tile || !tile.matches(':focus-visible')) return;
			const it = items.find((item) => item.el === tile);
			if (!it) return;
			s.vx = 0;
			s.vy = 0;
			s.x = stage.clientWidth / 2 - (it.x + it.w / 2);
			s.y = stage.clientHeight / 2 - (it.y + it.h / 2);
			render();
		};
		const resetScroll = () => {
			if (stage.scrollLeft || stage.scrollTop) stage.scrollTo(0, 0);
		};

		layout();
		raf = requestAnimationFrame(tick);
		const ro = new ResizeObserver(layout);
		ro.observe(stage);
		document.fonts?.ready.then(layout);

		stage.addEventListener('pointerdown', onPointerDown);
		stage.addEventListener('pointermove', onPointerMove);
		stage.addEventListener('pointerup', endDrag);
		stage.addEventListener('pointercancel', endDrag);
		stage.addEventListener('click', onClick);
		stage.addEventListener('wheel', onWheel, { passive: false });
		stage.addEventListener('focusin', onFocusIn);
		stage.addEventListener('scroll', resetScroll);
		window.addEventListener('keydown', onKey);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			stage.removeEventListener('pointerdown', onPointerDown);
			stage.removeEventListener('pointermove', onPointerMove);
			stage.removeEventListener('pointerup', endDrag);
			stage.removeEventListener('pointercancel', endDrag);
			stage.removeEventListener('click', onClick);
			stage.removeEventListener('wheel', onWheel);
			stage.removeEventListener('focusin', onFocusIn);
			stage.removeEventListener('scroll', resetScroll);
			window.removeEventListener('keydown', onKey);
		};
	}, []);

	return (
		<main className="fixed inset-0 h-svh overflow-hidden bg-[#0d0d0d] text-white">
			<div
				ref={stageRef}
				className="absolute inset-0 cursor-grab touch-none overflow-hidden select-none"
				role="group"
				aria-label="Galerie photo : glissez pour explorer"
			>
				{CELLS.map((cell, c) => {
					const setRef = (el: HTMLElement | null) => {
						cellRefs.current[c] = el;
					};
					if (cell.kind === 'name') {
						return (
							<div
								key="name"
								ref={setRef}
								aria-hidden="true"
								className="disp absolute top-0 left-0 whitespace-nowrap will-change-transform"
							>
								<span className="block">Paco</span>
								<span className="block text-[#ff4a1c]">Souharce</span>
							</div>
						);
					}
					if (cell.kind === 'text') {
						return (
							<p
								key="text"
								ref={setRef}
								className="absolute top-0 left-0 font-display leading-none font-extrabold tracking-[-0.03em] uppercase will-change-transform"
							>
								Je capture le flow plus que la performance.
							</p>
						);
					}
					const p = PHOTOS[cell.index];
					return (
						<button
							key={p.file}
							ref={setRef}
							type="button"
							data-i={cell.index}
							aria-label={`Agrandir : ${p.alt}`}
							className="absolute top-0 left-0 block cursor-[inherit] bg-white/5 shadow-[0_16px_38px_rgba(0,0,0,0.5)] will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff4a1c]"
						>
							<img
								src={thumb(p)}
								alt={p.alt}
								width={p.w}
								height={p.h}
								decoding="async"
								draggable={false}
								className="pointer-events-none block size-full object-contain text-[0px] text-transparent"
							/>
						</button>
					);
				})}
			</div>

			<div className="pointer-events-none absolute inset-x-0 top-3.5 z-10 flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-[clamp(12px,2vw,24px)]">
				<h1 className={chip}>Paco Souharce</h1>
				<p className={chip}>Photographe de surf — Hossegor</p>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-3.5 z-10 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 px-[clamp(12px,2vw,24px)]">
				<p className={chip}>Glissez dans tous les sens</p>
				<nav aria-label="Contact" className="flex flex-wrap justify-end gap-1.5">
					<a className={chipLink} href="https://www.instagram.com/souhpax/" target="_blank" rel="noopener noreferrer">
						Instagram @souhpax
					</a>
					<a className={chipLink} href="mailto:pacosouharce@gmail.com">
						pacosouharce@gmail.com
					</a>
					<a className={chipLink} href="tel:+33612743914">
						06 12 74 39 14
					</a>
				</nav>
			</div>

			<p className="sr-only">
				Paco Souharce, photographe de surf basé à Hossegor. Je cherche à capturer le flow du surfeur : le geste, la
				ligne, l'instant où le corps épouse la vague — plus que la performance.
			</p>

			{open !== null && <Lightbox index={open} onClose={close} onNav={nav} />}
		</main>
	);
}

function Lightbox({ index, onClose, onNav }: { index: number; onClose: () => void; onNav: (dir: number) => void }) {
	const boxRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const swipe = useRef<{ x: number; done: boolean } | null>(null);
	const p = PHOTOS[index];

	useEffect(() => {
		const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		closeRef.current?.focus();
		return () => previous?.focus({ preventScroll: true });
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			else if (e.key === 'ArrowRight') onNav(1);
			else if (e.key === 'ArrowLeft') onNav(-1);
			else if (e.key === 'Tab') {
				// le focus reste dans la visionneuse tant qu'elle est ouverte
				const buttons = boxRef.current?.querySelectorAll<HTMLElement>('button');
				if (!buttons || !buttons.length) return;
				const first = buttons[0];
				const lastButton = buttons[buttons.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					lastButton.focus();
				} else if (!e.shiftKey && document.activeElement === lastButton) {
					e.preventDefault();
					first.focus();
				}
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose, onNav]);

	return (
		<div
			ref={boxRef}
			role="dialog"
			aria-modal="true"
			aria-label={`Photo ${index + 1} sur ${PHOTOS.length}`}
			className="fixed inset-0 z-50 flex touch-none items-center justify-center bg-[#0d0d0d]/97"
			onPointerDown={(e) => {
				swipe.current = { x: e.clientX, done: false };
			}}
			onPointerUp={(e) => {
				const start = swipe.current;
				if (!start) return;
				const dx = e.clientX - start.x;
				if (Math.abs(dx) > 50) {
					start.done = true;
					onNav(dx < 0 ? 1 : -1);
				}
			}}
			onClick={(e) => {
				const swiped = swipe.current?.done;
				swipe.current = null;
				if (!swiped && e.target === e.currentTarget) onClose();
			}}
		>
			<div
				className="pointer-events-none relative"
				style={{
					width: `min(100vw - 32px, (100svh - 150px) * ${(p.w / p.h).toFixed(5)})`,
					aspectRatio: `${p.w} / ${p.h}`,
				}}
			>
				{/* la version légère, déjà chargée, s'affiche tout de suite ; la pleine définition la recouvre */}
				<img
					key={`m-${p.file}`}
					src={thumb(p)}
					alt=""
					aria-hidden="true"
					draggable={false}
					className="absolute inset-0 size-full object-contain"
				/>
				<img
					key={p.file}
					src={full(p)}
					alt={p.alt}
					width={p.w}
					height={p.h}
					draggable={false}
					className="absolute inset-0 size-full object-contain"
				/>
			</div>

			<button
				ref={closeRef}
				type="button"
				onClick={onClose}
				className={`${chipLink} absolute top-3.5 right-[clamp(12px,2vw,24px)] cursor-pointer`}
			>
				Fermer
			</button>

			<div className="absolute inset-x-0 bottom-3.5 flex items-center justify-center gap-1.5">
				<button
					type="button"
					onClick={() => onNav(-1)}
					aria-label="Photo précédente"
					className={`${chipLink} cursor-pointer`}
				>
					←
				</button>
				<span className={`${chip} tabular-nums`}>
					{pad(index + 1)} / {pad(PHOTOS.length)}
				</span>
				<button
					type="button"
					onClick={() => onNav(1)}
					aria-label="Photo suivante"
					className={`${chipLink} cursor-pointer`}
				>
					→
				</button>
			</div>
		</div>
	);
}
