import Logo from "@/components/Logo";

export function Footer() {
    return (
        <footer
            className="py-12 relative overflow-hidden"
            style={{
                backgroundColor: "var(--bg)",
                borderTop: "1px solid var(--border)",
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                    <Logo className="w-3 h-3" style={{ color: "var(--text-primary)" }} />
                    <span
                        className="text-sm font-bold tracking-tight"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Karta
                    </span>
                </div>
                <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                >
                    © {new Date().getFullYear()} Karta Inc.
                </p>
            </div>
        </footer>
    );
}
