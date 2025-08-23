import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('should render with custom variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button', { name: 'Secondary' });
    expect(button).toHaveClass('bg-gray-600', 'text-white');
  });

  it('should render with custom size', () => {
    render(<Button size="sm">Small</Button>);
    
    const button = screen.getByRole('button', { name: 'Small' });
    expect(button).toHaveClass('h-8', 'px-3', 'text-sm');
  });

  it('should render in disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
  });

  it('should render in loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
    
    // Should show loading spinner
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not handle click when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not handle click when loading', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button', { name: 'Custom' });
    expect(button).toHaveClass('custom-class');
  });

  it('should render ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    
    const button = screen.getByRole('button', { name: 'Ghost' });
    expect(button).toHaveClass('text-gray-700', 'hover:bg-gray-100');
  });

  it('should render success variant', () => {
    render(<Button variant="success">Success</Button>);
    
    const button = screen.getByRole('button', { name: 'Success' });
    expect(button).toHaveClass('bg-green-600', 'text-white');
  });

  it('should render danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-red-600', 'text-white');
  });

  it('should render outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    
    const button = screen.getByRole('button', { name: 'Outline' });
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white');
  });

  it('should render large size', () => {
    render(<Button size="lg">Large</Button>);
    
    const button = screen.getByRole('button', { name: 'Large' });
    expect(button).toHaveClass('h-12', 'px-6', 'text-lg');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should handle keyboard events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);
    
    const button = screen.getByRole('button', { name: 'Keyboard' });
    fireEvent.keyDown(button, { key: 'Enter' });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with icon', () => {
    const Icon = () => <span data-testid="icon">🔥</span>;
    render(
      <Button>
        <Icon />
        With Icon
      </Button>
    );
    
    const button = screen.getByRole('button', { name: 'With Icon' });
    const icon = screen.getByTestId('icon');
    
    expect(button).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it('should maintain focus styles', () => {
    render(<Button>Focus me</Button>);
    
    const button = screen.getByRole('button', { name: 'Focus me' });
    button.focus();
    
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });

  it('should render with proper ARIA attributes', () => {
    render(
      <Button 
        aria-label="Custom label"
        aria-describedby="description"
        loading
      >
        ARIA Button
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
    expect(button).toHaveAttribute('aria-describedby', 'description');
    expect(button).toBeDisabled();
  });
});