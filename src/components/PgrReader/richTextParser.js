export function parseRichTextToSegments(rawText) {
  if (!rawText) return [];
  
  const segments = [];
  const tagRegex = /(<\/?[a-zA-Z0-9#=]+>)/g;
  const parts = rawText.split(tagRegex);
  
  const styleStack = [];
  
  const getCurrentStyle = () => {
    const style = {};
    styleStack.forEach(s => {
      if (s.color) style.color = s.color;
      if (s.fontSize) style.fontSize = s.fontSize;
      if (s.bold) style.fontWeight = 'bold';
      if (s.italic) style.fontStyle = 'italic';
    });
    return style;
  };
  
  for (const part of parts) {
    if (part.startsWith('<') && part.endsWith('>')) {
      const isClose = part.startsWith('</');
      const tagContent = isClose ? part.slice(2, -1) : part.slice(1, -1);
      const tagLower = tagContent.toLowerCase();
      
      if (isClose) {
        const tagName = tagLower.split('=')[0];
        for (let i = styleStack.length - 1; i >= 0; i--) {
          if (styleStack[i].type === tagName) {
            styleStack.splice(i, 1);
            break;
          }
        }
      } else {
        const eqIndex = tagLower.indexOf('=');
        const tagName = eqIndex === -1 ? tagLower : tagLower.slice(0, eqIndex);
        const tagValue = eqIndex === -1 ? '' : tagContent.slice(eqIndex + 1);
        
        const newStyle = { type: tagName };
        if (tagName === 'color') {
          newStyle.color = tagValue;
        } else if (tagName === 'size') {
          newStyle.fontSize = `${parseInt(tagValue) * 0.85}px`;
        } else if (tagName === 'b') {
          newStyle.bold = true;
        } else if (tagName === 'i') {
          newStyle.italic = true;
        }
        styleStack.push(newStyle);
      }
    } else if (part) {
      segments.push({
        text: part,
        style: getCurrentStyle()
      });
    }
  }
  return segments;
}
