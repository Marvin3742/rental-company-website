import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Image from "../ui/Image";
import "./GalleryGrid.css";

export default function GalleryGrid({ items }) {
  const [index, setIndex] = useState(-1);

  const slides = items.map((i) => ({ src: i.src, alt: i.alt, title: i.category }));

  return (
    <>
      <div className="gallery-grid">
        {items.map((item, i) => (
          <button
            key={item.src}
            type="button"
            className="gallery-grid__tile"
            onClick={() => setIndex(i)}
            aria-label={`Open larger view: ${item.alt}`}
          >
            <Image src={item.src} alt={item.alt} />
          </button>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides}
      />
    </>
  );
}
