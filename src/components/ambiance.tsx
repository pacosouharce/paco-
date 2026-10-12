import { useCallback, useEffect, useRef, useState } from 'react';

type Photo = { file: string; w: number; h: number; alt: string; color?: string };

const INK = '#0d0d0d';

// Dimensions réelles des fichiers : chaque photo est affichée dans une boîte
// à son ratio exact, jamais recadrée ni déformée.
// `color` est la couleur dominante mesurée sur la photo ; les photos en noir
// et blanc n'en ont pas et passent sur fond noir.
const PHOTOS: Photo[] = [
	{ file: '17-longboard.jpg', w: 2400, h: 1600, alt: 'Longboardeur debout sur sa planche au coucher du soleil', color: '#9f8d80' },
	{ file: '16-tube.jpg', w: 2400, h: 1600, alt: 'Surfeur dans le tube, contre-jour, noir et blanc' },
	{ file: '07-chute.jpg', w: 1920, h: 2400, alt: 'Surfeur accroupi sur une vague immense, noir et blanc' },
	{ file: '18-soleil.jpg', w: 1600, h: 2400, alt: "Silhouette d'un surfeur sous un soleil couchant orangé", color: '#e1b07e' },
	{ file: '04-carve.jpg', w: 2400, h: 1601, alt: 'Surfeur en plein virage sur une vague verte', color: '#408faf' },
	{ file: '02-envol.jpg', w: 1800, h: 2400, alt: "Surfeur en l'air, contre-jour bleu clair", color: '#66848c' },
	{ file: '19-houle.jpg', w: 1366, h: 2048, alt: "Surfeur flou derrière la houle, au ras de l'eau, noir et blanc" },
	{ file: '09-glisse.jpg', w: 2400, h: 1601, alt: 'Surfeur en glisse sur une vague turquoise', color: '#7d979d' },
	{ file: '11-contrejour.jpg', w: 1600, h: 2400, alt: 'Surfeur à contre-jour doré, éclaboussures', color: '#bcae9e' },
	{ file: '05-rame.jpg', w: 2400, h: 1599, alt: 'Surfeur qui rame, plan large', color: '#69868d' },
	{ file: '13-rire.jpg', w: 1800, h: 2400, alt: 'Portrait rapproché, rire, noir et blanc' },
	{ file: '14-visee.jpg', w: 2400, h: 1601, alt: "Surfeur tenant une caméra devant l'œil, profil" },
	{ file: '10-reprise.jpg', w: 1920, h: 2400, alt: 'Surfeur en glisse, ciel pâle, combinaison bordeaux', color: '#87a0a5' },
	{ file: '03-fart.jpg', w: 2400, h: 1800, alt: 'Mains fartant une planche de surf, noir et blanc' },
	{ file: '12-entree.jpg', w: 1800, h: 2400, alt: 'Surfeur prenant une vague, plan large noir et blanc' },
	{ file: '01-ecume.jpg', w: 1800, h: 2400, alt: "Éclaboussure d'eau en gros plan, tons sépia", color: '#5e6060' },
	{ file: '06-marche.jpg', w: 1601, h: 2400, alt: 'Silhouette marchant vers la mer, plage à marée basse', color: '#95b3bc' },
	{ file: '08-gerbe.jpg', w: 1920, h: 2400, alt: "Gros plan sur une gerbe d'eau, noir et blanc" },
	{ file: '15-crepuscule.jpg', w: 1601, h: 2400, alt: "Silhouette dans l'eau face au soleil couchant", color: '#604a2d' },
];
const N = PHOTOS.length;

// Version allégée (1200 px de grand côté) et pleine définition.
const thumb = (p: Photo) => `/images/m/${p.file}`;
const full = (p: Photo) => `/images/${p.file}`;
const thumbWidth = (p: Photo) => (p.w >= p.h ? 1200 : Math.round((1200 * p.w) / p.h));
const srcSet = (p: Photo) => `${thumb(p)} ${thumbWidth(p)}w, ${full(p)} ${p.w}w`;

// Largeur de la photo à l'écran : la plus grande qui tient en largeur et en
// hauteur, la hauteur suit par le ratio.
const frame = (p: Photo) =>
	`min(100vw - 2 * clamp(16px, 7vw, 110px), (100svh - 150px) * ${(p.w / p.h).toFixed(5)})`;
const frameLarge = (p: Photo) => `min(100vw - 24px, (100svh - 24px) * ${(p.w / p.h).toFixed(5)})`;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pad = (n: number) => String(n).padStart(2, '0');
const luminance = (hex: string) =>
	(0.2126 * parseInt(hex.slice(1, 3), 16) + 0.7152 * parseInt(hex.slice(3, 5), 16) + 0.0722 * parseInt(hex.slice(5, 7), 16)) /
	255;

const chip =
	'inline-flex min-h-[34px] items-center rounded-full border-[1.5px] border-white bg-[#0d0d0d] px-3.5 text-xs font-medium tracking-[0.04em] whitespace-nowrap text-white uppercase';
const chipButton = `${chip} cursor-pointer transition-colors hover:bg-white hover:text-[#0d0d0d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;

export default function Ambiance() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const [open, setOpen] = useState<number | null>(null);
	// photo visée par la navigation au clavier, pendant que le défilement est en cours
	const target = useRef(0);

	const bg = PHOTOS[index].color ?? INK;
	const fg = luminance(bg) > 0.45 ? INK : '#ffffff';

	const go = useCallback((i: number) => {
		const el = scrollRef.current;
		if (!el) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		target.current = clamp(i, 0, N - 1);
		el.scrollTo({ top: target.current * el.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
	}, []);

	const close = useCallback(() => setOpen(null), []);
	const nav = useCallback((dir: number) => {
		setOpen((i) => (i === null ? i : mod(i + dir, N)));
	}, []);

	// La photo à l'écran donne sa couleur au fond.
	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		let settle = 0;
		const current = () => clamp(Math.round(el.scrollTop / (el.clientHeight || 1)), 0, N - 1);
		const onScroll = () => {
			setIndex(current());
			window.clearTimeout(settle);
			settle = window.setTimeout(() => {
				target.current = current();
			}, 140);
		};
		const ro = new ResizeObserver(() => {
			el.scrollTop = target.current * el.clientHeight;
		});
		ro.observe(el);
		el.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			window.clearTimeout(settle);
			ro.disconnect();
			el.removeEventListener('scroll', onScroll);
		};
	}, []);

	useEffect(() => {
		document.body.style.backgroundColor = bg;
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
	}, [bg]);

	// Dans la visionneuse, la page suit la photo affichée : à la fermeture on
	// retrouve la même.
	useEffect(() => {
		const el = scrollRef.current;
		if (open === null || !el) return;
		target.current = open;
		el.scrollTo({ top: open * el.clientHeight, behavior: 'auto' });
	}, [open]);

	useEffect(() => {
		if (open !== null) return;
		const onKey = (e: KeyboardEvent) => {
			const onControl = e.target instanceof Element && e.target.closest('a, button') !== null;
			let next: number;
			if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') next = target.current + 1;
			else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') next = target.current - 1;
			else if (e.key === ' ' && !onControl) next = target.current + (e.shiftKey ? -1 : 1);
			else if (e.key === 'Home') next = 0;
			else if (e.key === 'End') next = N - 1;
			else return;
			e.preventDefault();
			go(next);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, go]);

	return (
		<main
			className="fixed inset-0 h-svh overflow-hidden transition-[background-color,color] duration-700 ease-out"
			style={{ backgroundColor: bg, color: fg }}
		>
			<div
				ref={scrollRef}
				tabIndex={0}
				role="group"
				aria-label="Photographies, une par écran"
				className="absolute inset-0 snap-y snap-mandatory overflow-y-auto overscroll-none [scrollbar-width:none] focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
			>
				{PHOTOS.map((p, i) => (
					<section key={p.file} className="relative flex h-full snap-start snap-always items-center justify-center">
						<span
							aria-hidden="true"
							className="disp pointer-events-none absolute bottom-28 left-[clamp(10px,2.5vw,36px)] text-[clamp(110px,27vw,430px)] leading-[0.74] tabular-nums opacity-[0.17] min-[701px]:bottom-[58px]"
						>
							{pad(i + 1)}
						</span>
						<button
							type="button"
							onClick={() => setOpen(i)}
							aria-label={`Agrandir : ${p.alt}`}
							className="relative block cursor-zoom-in shadow-[0_34px_90px_rgba(0,0,0,0.3),0_6px_18px_rgba(0,0,0,0.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
							style={{ width: frame(p), aspectRatio: `${p.w} / ${p.h}` }}
						>
							<img
								src={thumb(p)}
								srcSet={srcSet(p)}
								sizes={frame(p)}
								alt={p.alt}
								width={p.w}
								height={p.h}
								loading={i < 2 ? 'eager' : 'lazy'}
								decoding="async"
								draggable={false}
								className="block size-full object-contain text-[0px] text-transparent"
							/>
						</button>
					</section>
				))}
			</div>

			<div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-[clamp(16px,3vw,40px)] text-[13px] font-medium tracking-[0.04em] uppercase">
				<h1 className="disp text-[clamp(20px,2.6vw,34px)] tracking-[-0.02em]">Paco Souharce</h1>
				<p>Photographe de surf — Hossegor</p>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-[clamp(16px,3vw,40px)] text-[13px] font-medium tracking-[0.04em] uppercase">
				<p className="tabular-nums">
					{pad(index + 1)} / {pad(N)}
				</p>
				<nav aria-label="Contact" className="pointer-events-auto flex flex-wrap justify-end gap-x-[18px] gap-y-1">
					<a
						className="border-b border-current pb-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
						href="https://www.instagram.com/souhpax/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Instagram @souhpax"
					>
						<span className="max-[700px]:hidden">Instagram </span>@souhpax
					</a>
					<a
						className="border-b border-current pb-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
						href="mailto:pacosouharce@gmail.com"
					>
						pacosouharce@gmail.com
					</a>
					<a
						className="border-b border-current pb-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
						href="tel:+33612743914"
					>
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
			else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') onNav(1);
			else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') onNav(-1);
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
			aria-label={`Photo ${index + 1} sur ${N}`}
			className="fixed inset-0 z-50 flex cursor-zoom-out touch-none items-center justify-center bg-[#0d0d0d]"
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
			<div className="pointer-events-none relative" style={{ width: frameLarge(p), aspectRatio: `${p.w} / ${p.h}` }}>
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
				className={`${chipButton} absolute top-3.5 right-[clamp(12px,2vw,24px)]`}
			>
				Fermer
			</button>

			<div className="absolute inset-x-0 bottom-3.5 flex cursor-default items-center justify-center gap-1.5">
				<button type="button" onClick={() => onNav(-1)} aria-label="Photo précédente" className={chipButton}>
					←
				</button>
				<span className={`${chip} tabular-nums`}>
					{pad(index + 1)} / {pad(N)}
				</span>
				<button type="button" onClick={() => onNav(1)} aria-label="Photo suivante" className={chipButton}>
					→
				</button>
			</div>
		</div>
	);
}
