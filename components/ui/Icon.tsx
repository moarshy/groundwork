import { icons, LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: keyof typeof icons;
}

const Icon = ({ name, color, size, ...props }: IconProps) => {
  const LucideIcon = icons[name];
  if (!LucideIcon) {
    // Fallback or error handling for invalid icon name
    // For example, return a default icon or null
    console.warn(`Icon with name "${name}" not found.`);
    return null; // Or <DefaultIcon />
  }
  return <LucideIcon color={color} size={size} {...props} />;
};
export default Icon; 