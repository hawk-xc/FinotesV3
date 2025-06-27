const GoogleLogo = ({ alt, className, ...props }: { 
  alt: string; 
  className?: string;
  [key: string]: any;
}) => {
  return (
    <img 
      src="/assets/google-icon.svg" 
      alt={alt || "Google logo"}    
      className={className}
      {...props}
    />
  );
};

export default GoogleLogo;