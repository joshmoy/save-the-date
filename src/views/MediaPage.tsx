"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { MediaCollection, MediaItem } from "../data/media";
import styles from "./MediaPage.module.css";

export default function MediaPage({ collections }: { collections: MediaCollection[] }) {
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const featured = collections.find((collection) => collection.items.length > 0)?.items[0];

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
          src={featured?.src ?? "/7V2A8743.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized={Boolean(featured)}
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
            <span>Wedding photographs</span>
            <span>{collections.length} collections</span>
          </div>
          <p className={styles.heroDescription}>
            Relive the moments, details, and celebrations that brought us here. A growing collection
            of our favorite memories, all in one place.
          </p>
          {featured ? (
            <button className={styles.heroButton} type="button" onClick={() => setSelected(featured)}>
              <Eye size={17} aria-hidden="true" />
              View featured photo
            </button>
          ) : null}
        </div>
      </section>

      <div className={styles.collections}>
        {collections.map((collection) => (
          <section
            className={styles.collection}
            key={collection.slug}
            aria-labelledby={`collection-${collection.slug}`}
          >
            <div className={styles.collectionHeader}>
              <div>
                <h2 className={styles.collectionTitle} id={`collection-${collection.slug}`}>
                  {collection.title}
                </h2>
                <p className={styles.collectionDescription}>{collection.description}</p>
              </div>
              {collection.items.length > 0 ? (
                <span className={styles.collectionCount}>
                  {collection.items.length} photo{collection.items.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            {collection.items.length > 0 ? (
              <div className={styles.rail}>
                {collection.items.map((item) => (
                  <button
                    className={styles.card}
                    type="button"
                    key={item.id}
                    onClick={() => setSelected(item)}
                    aria-label={`View ${item.title}`}
                  >
                    <Image
                      className={styles.cardImage}
                      src={item.thumbnail ?? item.src}
                      alt={item.title}
                      fill
                      loading="lazy"
                      sizes="(max-width: 720px) 76vw, 24vw"
                      unoptimized
                    />
                    <span className={styles.cardShade} />
                    <span className={styles.playBadge}>
                      <Eye size={17} aria-hidden="true" />
                    </span>
                    <span className={styles.cardContent}>
                      <span className={styles.cardType}>{collection.title}</span>
                      <span className={styles.cardTitle}>{item.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.emptyCollection}>
                <span className={styles.emptyIcon}>
                  <ImageIcon size={22} aria-hidden="true" />
                </span>
                <div>
                  <p>Photos coming soon</p>
                  <span>This collection will appear here as memories are added.</span>
                </div>
              </div>
            )}
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
              <Image
                className={styles.modalImage}
                src={selected.src}
                alt={selected.title}
                fill
                sizes="(max-width: 720px) 100vw, 70vw"
                unoptimized
              />
            </div>
            <div className={styles.modalInfo}>
              <span className={styles.cardType}>
                {selected.event}
                {selected.date ? ` · ${selected.date}` : ""}
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
