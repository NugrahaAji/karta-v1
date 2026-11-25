import type { ReactNode } from "react";
import styles from "./assessment.module.css";

/** Keep large assessment matrices navigable without widening the workspace. */
export function MatrixViewport({ label, children }: { label: string; children: ReactNode }) {
    return <div className={styles.matrixViewport} role="region" aria-label={label} tabIndex={0}>{children}</div>;
}

export function CellList({ items, ordered = false, empty = "Not recorded" }: { items: string[]; ordered?: boolean; empty?: string }) {
    const List = ordered ? "ol" : "ul";
    const content = items.filter(item => item.trim());
    return content.length ? <List className={styles.cellList} data-ordered={ordered}>{content.map((item, index) => <li key={index}>{item}</li>)}</List> : <span className={styles.copy}>{empty}</span>;
}
