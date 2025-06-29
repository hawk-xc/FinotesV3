const FinotesLogo = ({ alt, className, ...props }: { 
  alt: string; 
  className?: string;
  [key: string]: any;
}) => {
  return (
    <img 
      src="/assets/finoteslogo.png" 
      alt={alt || "Finotes logo"}    
      className={className}
      {...props}
    />
  );
};

export default FinotesLogo;