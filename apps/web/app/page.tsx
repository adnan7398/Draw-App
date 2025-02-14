"use client"
import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";


export default function Home() {
  return (
    <div className={styles.page}>
        <main className={styles.main}/>
    </div>
  );
}
