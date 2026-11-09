"use client";

import { Search, X } from "lucide-react";
import { IconButton } from "./Button";
import { TextField, type TextFieldProps } from "./TextField";
import styles from "./ui.module.css";

export function SearchField({ onClear, shortcut, ...props }: Omit<TextFieldProps, "type" | "leadingIcon" | "trailingAdornment"> & {
    onClear?: () => void;
    shortcut?: string;
}) {
    return <TextField {...props} type="search" leadingIcon={<Search />} trailingAdornment={
        props.value && onClear
            ? <IconButton className={styles.fieldAction} aria-label="Clear search" onClick={onClear} disabled={props.disabled}><X aria-hidden="true" /></IconButton>
            : shortcut && <kbd className={styles.shortcutKey} aria-hidden="true">{shortcut}</kbd>
    } />;
}
