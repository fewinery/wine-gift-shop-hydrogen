export const ArrowLeft = () => (
  <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20.5 11.3999H8.33L13.92 5.8099L12.5 4.3999L4.5 12.3999L12.5 20.3999L13.91 18.9899L8.33 13.3999H20.5V11.3999Z"
      fill="black"
    />
  </svg>
);

export const ArrowRight = () => (
  <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.5 4.3999L11.09 5.8099L16.67 11.3999H4.5V13.3999H16.67L11.09 18.9899L12.5 20.3999L20.5 12.3999L12.5 4.3999Z"
      fill="black"
    />
  </svg>
);

export const EditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);
