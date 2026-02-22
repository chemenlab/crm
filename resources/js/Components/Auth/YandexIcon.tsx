export default function YandexIcon({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 18h-2.25l-2.625-6.75h-.375V18H9V6h3.75c2.625 0 4.125 1.125 4.125 3.375 0 1.5-.75 2.625-2.25 3.375L16.5 18zm-5.25-8.25h1.125c1.125 0 1.875-.375 1.875-1.5s-.75-1.5-1.875-1.5H11.25v3z"
                fill="#FC3F1D"
            />
        </svg>
    );
}
