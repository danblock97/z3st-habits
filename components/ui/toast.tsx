"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Toast = {
	id: string;
	title: string;
	description?: string;
	type?: "success" | "error" | "warning" | "info";
	duration?: number;
};

type ToastProps = {
	toast: Toast;
	onDismiss: (id: string) => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Trigger animation
		const timer = setTimeout(() => setIsVisible(true), 10);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (toast.duration) {
			const timer = setTimeout(() => {
				setIsVisible(false);
				setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
			}, toast.duration);
			return () => clearTimeout(timer);
		}
	}, [toast.duration, toast.id, onDismiss]);

	const handleDismiss = () => {
		setIsVisible(false);
		setTimeout(() => onDismiss(toast.id), 300);
	};

	const typeStyles = {
		success:
			"border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200",
		error:
			"border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200",
		warning:
			"border-amber-200 bg-amber-50 text-amber-800 dark:border-primary/40 dark:bg-primary/15 dark:text-primary",
		info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-200",
	} as const;

	return (
		<div
			className={cn(
				"transform transition-all duration-300 ease-in-out",
				isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
			)}
		>
			<div
				className={cn(
					"flex items-start gap-3 rounded-lg border p-4 shadow-lg",
					typeStyles[toast.type || "info"]
				)}
			>
				<div className="flex-1">
					<h4 className="font-semibold">{toast.title}</h4>
					{toast.description && (
						<p className="text-sm opacity-90 mt-1">{toast.description}</p>
					)}
				</div>
				<button
					onClick={handleDismiss}
					className="opacity-70 hover:opacity-100 transition-opacity"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

type ToastContainerProps = {
	toasts: Toast[];
	onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
	if (toasts.length === 0) return null;

	return (
		<div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
			{toasts.map((toast) => (
				<Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
			))}
		</div>
	);
}
