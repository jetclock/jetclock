import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import Splide from '@splidejs/splide';

export default function SlideHolder({ slides }) {
    const splideEl = useRef(null);
    const splideInstance = useRef(null);

    useEffect(() => {
        if (splideEl.current) {
            splideInstance.current = new Splide(splideEl.current, {
                type: 'loop',
                arrows: false,
                autoplay: true,
                interval: 10000,
                pagination: false,
                speed: 1000,
                height: '480px',
                width: '480px',
                direction: 'ttb',
            });

            splideInstance.current.mount();
        }

        return () => {
            if (splideInstance.current) {
                splideInstance.current.destroy();
            }
        };
    }, []);

    return (
        <div ref={splideEl} className="splide">
            <div className="splide__track">
                <ul className="splide__list">
                    {slides.map((slide) => (
                        <li key={slide.id} className="splide__slide">
                            <div className="h-full w-full relative flex">{slide.component}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
