"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { mediaCollections, mediaItems, type MediaItem } from "../data/media";
import styles from "./MediaPage.module.css";

export default function MediaPage() {
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const featured = mediaItems[0];

  useEffect(() => {
    if (!selected) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected]);

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/" className={styles.brand}>
          A & J
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            Home
          </Link>
          <Link href="/updates" className={styles.navLink}>
            Updates
          </Link>
          <span className={`${styles.navLink} ${styles.navLinkActive}`}>Media</span>
        </div>
      </nav>

      <section className={styles.hero} aria-labelledby="media-heading">
        <Image
          className={styles.heroImage}
          src={featured.src}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Adeola & Joshua present</p>
          <h1 id="media-heading" className={styles.heroTitle}>
            Our story
            <span className={styles.heroScript}>in every frame</span>
          </h1>
          <div className={styles.heroMeta}>
            <span>2025–2026</span>
            <span>Photos & films</span>
            <span>Our journey</span>
          </div>
          <p className={styles.heroDescription}>
            Relive the moments, details, and celebrations that brought us here. A growing collection
            of our favorite memories, all in one place.
          </p>
          <button className={styles.heroButton} type="button" onClick={() => setSelected(featured)}>
            <Play size={17} fill="currentColor" aria-hidden="true" />
            View featured memory
          </button>
        </div>
      </section>

      <div className={styles.collections}>
        {mediaCollections.map((collection) => (
          <section className={styles.collection} key={collection.title} aria-labelledby={collection.title}>
            <h2 className={styles.collectionTitle} id={collection.title}>
              {collection.title}
            </h2>
            <div className={styles.rail}>
              {collection.items.map((item) => (
                <button
                  className={styles.card}
                  type="button"
                  key={`${collection.title}-${item.id}`}
                  onClick={() => setSelected(item)}
                  aria-label={`${item.type === "video" ? "Play" : "View"} ${item.title}`}
                >
                  <Image
                    className={styles.cardImage}
                    src={item.poster ?? item.src}
                    alt={item.title}
                    fill
                    loading="lazy"
                    sizes="(max-width: 720px) 76vw, 24vw"
                  />
                  <span className={styles.cardShade} />
                  <span className={styles.playBadge}>
                    {item.type === "video" ? (
                      <Play size={16} fill="currentColor" aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </span>
                  <span className={styles.cardContent}>
                    <span className={styles.cardType}>
                      {item.event} · {item.type}
                    </span>
                    <span className={styles.cardTitle}>{item.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <footer className={styles.footer}>
          <span>Adeola & Joshua</span>
          <span>More memories coming soon</span>
        </footer>
      </div>

      {selected && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div className={styles.modalPanel}>
            <button
              className={styles.closeButton}
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close media viewer"
              autoFocus
            >
              <X size={20} aria-hidden="true" />
            </button>
            <div className={styles.modalMedia}>
              {selected.type === "video" ? (
                <video
                  className={styles.video}
                  src={selected.src}
                  poster={selected.poster}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support HTML video.
                </video>
              ) : (
                <Image
                  className={styles.modalImage}
                  src={selected.src}
                  alt={selected.title}
                  fill
                  sizes="(max-width: 720px) 100vw, 70vw"
                />
              )}
            </div>
            <div className={styles.modalInfo}>
              <span className={styles.cardType}>
                {selected.event} · {selected.date}
              </span>
              <h2 id="media-modal-title">{selected.title}</h2>
              <p>{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
