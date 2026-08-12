"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, ImageIcon, Play, Video, X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { MediaCollection, MediaItem } from "../data/media";
import styles from "./MediaPage.module.css";

type ViewerState = {
  item: MediaItem;
  sequence: MediaItem[];
};

function getAdjacentViewer(current: ViewerState | null, direction: -1 | 1) {
  if (!current) return null;
  const index = current.sequence.findIndex((item) => item.id === current.item.id);
  const nextItem = current.sequence[index + direction];
  return nextItem ? { ...current, item: nextItem } : current;
}

function Carousel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState({
    hasOverflow: false,
    canPrevious: false,
    canNext: false,
  });

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maximumScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);

    setControls({
      hasOverflow: maximumScroll > 2,
      canPrevious: rail.scrollLeft > 2,
      canNext: rail.scrollLeft < maximumScroll - 2,
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(rail);
    rail.addEventListener("scroll", updateControls, { passive: true });

    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", updateControls);
    };
  }, [updateControls]);

  function move(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction * Math.max(250, rail.clientWidth * 0.82),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.rail} ref={railRef}>
        {children}
      </div>
      {controls.hasOverflow ? (
        <>
          <button
            className={`${styles.carouselButton} ${styles.carouselPrevious}`}
            type="button"
            onClick={() => move(-1)}
            disabled={!controls.canPrevious}
            aria-label={`Show previous ${label}`}
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
          <button
            className={`${styles.carouselButton} ${styles.carouselNext}`}
            type="button"
            onClick={() => move(1)}
            disabled={!controls.canNext}
            aria-label={`Show next ${label}`}
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        </>
      ) : null}
    </div>
  );
}

export default function MediaPage({ collections }: { collections: MediaCollection[] }) {
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const featuredCollection = collections.find((collection) => collection.items.length > 0);
  const featured = featuredCollection?.items[0];
  const selected = viewer?.item;
  const selectedIndex = viewer
    ? viewer.sequence.findIndex((item) => item.id === viewer.item.id)
    : -1;
  const canViewPrevious = selectedIndex > 0;
  const canViewNext = Boolean(viewer && selectedIndex < viewer.sequence.length - 1);

  useEffect(() => {
    if (!viewer) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewer(null);
      if (event.key === "ArrowLeft") {
        setViewer((current) => getAdjacentViewer(current, -1));
      }
      if (event.key === "ArrowRight") {
        setViewer((current) => getAdjacentViewer(current, 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewer]);

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
            <span>Wedding photos & films</span>
            <span>{collections.length} collections</span>
          </div>
          <p className={styles.heroDescription}>
            Relive the moments, details, and celebrations that brought us here. A growing collection
            of our favorite memories, all in one place.
          </p>
          {featured ? (
            <button
              className={styles.heroButton}
              type="button"
              onClick={() =>
                setViewer({ item: featured, sequence: featuredCollection?.items ?? [featured] })
              }
            >
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
              {collection.items.length + collection.videos.length > 0 ? (
                <span className={styles.collectionCount}>
                  {collection.items.length + collection.videos.length} item
                  {collection.items.length + collection.videos.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <h3 className={styles.subsectionTitle}>Photos</h3>
            {collection.items.length > 0 ? (
              <Carousel label={`${collection.title} photos`}>
                {collection.items.map((item) => (
                  <button
                    className={styles.card}
                    type="button"
                    key={item.id}
                    onClick={() => setViewer({ item, sequence: collection.items })}
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
              </Carousel>
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
            {collection.hasVideos ? (
              <>
                <h3 className={styles.subsectionTitle}>Videos</h3>
                {collection.videos.length > 0 ? (
                  <Carousel label={`${collection.title} videos`}>
                    {collection.videos.map((item) => (
                      <button
                        className={`${styles.card} ${styles.videoCard}`}
                        type="button"
                        key={item.id}
                        onClick={() => setViewer({ item, sequence: collection.videos })}
                        aria-label={`Play ${item.title}`}
                      >
                        <span className={styles.videoBackdrop}>
                          <Video size={44} strokeWidth={1.2} aria-hidden="true" />
                        </span>
                        <span className={styles.cardShade} />
                        <span className={styles.playBadge}>
                          <Play size={16} fill="currentColor" aria-hidden="true" />
                        </span>
                        <span className={styles.cardContent}>
                          <span className={styles.cardType}>{collection.title} · Video</span>
                          <span className={styles.cardTitle}>{item.title}</span>
                        </span>
                      </button>
                    ))}
                  </Carousel>
                ) : (
                  <div className={styles.emptyCollection}>
                    <span className={styles.emptyIcon}>
                      <Video size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <p>Videos coming soon</p>
                      <span>This collection will appear here as films are added.</span>
                    </div>
                  </div>
                )}
              </>
            ) : null}
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
            if (event.target === event.currentTarget) setViewer(null);
          }}
        >
          <div className={styles.modalPanel}>
            <button
              className={styles.closeButton}
              type="button"
              onClick={() => setViewer(null)}
              aria-label="Close media viewer"
              autoFocus
            >
              <X size={20} aria-hidden="true" />
            </button>
            <div
              className={`${styles.modalMedia} ${
                selected.type === "video" ? styles.modalMediaVideo : ""
              }`}
            >
              {canViewPrevious ? (
                <button
                  className={`${styles.modalNavigation} ${styles.modalPrevious}`}
                  type="button"
                  onClick={() => setViewer((current) => getAdjacentViewer(current, -1))}
                  aria-label="View previous asset"
                >
                  <ChevronLeft size={28} aria-hidden="true" />
                </button>
              ) : null}
              {canViewNext ? (
                <button
                  className={`${styles.modalNavigation} ${styles.modalNext}`}
                  type="button"
                  onClick={() => setViewer((current) => getAdjacentViewer(current, 1))}
                  aria-label="View next asset"
                >
                  <ChevronRight size={28} aria-hidden="true" />
                </button>
              ) : null}
              {selected.type === "video" ? (
                <video
                  key={selected.id}
                  className={styles.video}
                  src={selected.src}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                >
                  Your browser does not support HTML video.
                </video>
              ) : (
                <Image
                  key={selected.id}
                  className={styles.modalImage}
                  src={selected.src}
                  alt={selected.title}
                  fill
                  sizes="(max-width: 720px) 100vw, 70vw"
                  unoptimized
                />
              )}
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
