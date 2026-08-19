import InfiniteGallery from '@/components/ui/3d-gallery-photography';

export default function DemoOne() {
	const images = [
		{ src: '/images/07-chute.jpg', alt: 'Surfeur accroupi sur une vague immense, noir et blanc' },
		{ src: '/images/01-ecume.jpg', alt: "Éclaboussure d'eau en gros plan, tons sépia" },
		{ src: '/images/02-envol.jpg', alt: "Surfeur en l'air, contre-jour bleu clair" },
		{ src: '/images/03-fart.jpg', alt: 'Mains farfouillant une planche de surf, noir et blanc' },
		{ src: '/images/04-carve.jpg', alt: 'Surfeur en plein virage sur une vague verte' },
		{ src: '/images/05-rame.jpg', alt: 'Surfeur qui rame, plan large noir et blanc' },
		{ src: '/images/06-marche.jpg', alt: 'Silhouette marchant vers la mer, plage à marée basse' },
		{ src: '/images/08-gerbe.jpg', alt: "Gros plan sur une gerbe d'eau, noir et blanc" },
		{ src: '/images/09-glisse.jpg', alt: 'Surfeur en glisse sur une vague turquoise' },
		{ src: '/images/10-reprise.jpg', alt: 'Surfeur en glisse, ciel pâle, combinaison bordeaux' },
		{ src: '/images/11-contrejour.jpg', alt: 'Surfeur à contre-jour doré, éclaboussures' },
		{ src: '/images/12-entree.jpg', alt: 'Surfeur prenant une vague, plan large noir et blanc' },
		{ src: '/images/13-rire.jpg', alt: 'Portrait rapproché, rire, noir et blanc' },
		{ src: '/images/14-visee.jpg', alt: "Surfeur tenant une caméra devant l'œil, profil" },
		{ src: '/images/15-crepuscule.jpg', alt: 'Silhouette dans l\'eau face au soleil couchant' },
	];

	return (
		<main className="min-h-screen h-full w-full bg-black">
			<InfiniteGallery
				images={images}
				speed={1.2}
				zSpacing={3}
				visibleCount={12}
				falloff={{ near: 0.8, far: 14 }}
				fadeSettings={{
					fadeIn: { start: 0.0, end: 0.06 },
					fadeOut: { start: 0.92, end: 1.0 },
				}}
				blurSettings={{
					blurIn: { start: 0.0, end: 0.04 },
					blurOut: { start: 0.92, end: 1.0 },
					maxBlur: 2.2,
				}}
				className="h-screen w-full overflow-hidden"
			/>

			<div className="h-screen inset-0 pointer-events-none fixed flex items-center justify-center text-center px-3 mix-blend-exclusion text-white">
				<h1 className="font-serif text-4xl md:text-7xl tracking-tight">
					<span className="italic">Paco Souharce</span>
				</h1>
			</div>

			<div className="fixed top-6 left-0 right-0 flex justify-center pointer-events-none">
				<p className="font-mono uppercase text-[11px] font-semibold tracking-widest text-white/80">
					Photographe de surf
				</p>
			</div>

			<div className="pointer-events-auto fixed bottom-24 left-0 right-0 flex justify-center">
				<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[11px] text-white/70">
					<a
						href="https://www.instagram.com/SOUHPAX/"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-white underline underline-offset-4"
					>
						Instagram — @SOUHPAX
					</a>
					<a href="mailto:pacosouharce@gmail.com" className="hover:text-white underline underline-offset-4">
						pacosouharce@gmail.com
					</a>
					<a href="tel:+33612743914" className="hover:text-white underline underline-offset-4">
						06 12 74 39 14
					</a>
				</div>
			</div>

			<div className="text-center fixed bottom-10 left-0 right-0 font-mono uppercase text-[11px] font-semibold text-white/60">
				<p>Use mouse wheel, arrow keys, or touch to navigate</p>
				<p className="opacity-60">
					Auto-play resumes after 3 seconds of inactivity
				</p>
			</div>
		</main>
	);
}
