'use client';
import styles from './wedding.module.css';
export default function Error({reset}:{reset:()=>void}){return <main className={styles.notice}><h1>We couldn’t show this wedding</h1><p>Please try again in a moment.</p><button onClick={reset}>Try again</button></main>;}
