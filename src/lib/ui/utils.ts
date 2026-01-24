export function cssVarToRgba(
  varName: string,
  alpha = 1,
  element: HTMLElement = document.documentElement,
) {
  const value = getComputedStyle(element).getPropertyValue(varName).trim();

  // Use the browser to normalize the color
  const temp = document.createElement("div");
  temp.style.color = value;
  document.body.appendChild(temp);

  const rgb = getComputedStyle(temp).color; // "rgb(r, g, b)"
  document.body.removeChild(temp);

  const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
