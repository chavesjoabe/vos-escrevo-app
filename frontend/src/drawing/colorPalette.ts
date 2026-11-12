// Muted, sophisticated pastel-based pencil inks
// Engineered to be "not too dark, but not too light" with optimal readability and soft aesthetic tones
export const pencilColors = {
  graphite: "#526071",    // Grafite Suave (Soft slate pastel)
  blue: "#4F759B",        // Azul Pastel (Dusty French blue pastel)
  terracotta: "#B85D4B",  // Terracota Suave (Muted terracotta coral)
  sage: "#4E7D63",        // Sálvia Pastel (Dusty eucalyptus sage)
  lavender: "#7D5F8A",    // Lavanda Queimada (Muted mauve lavender)
};

// Luminous soft chalk pastels for Dark Mode
export const darkPencilColors = {
  chalk: "#D5DEE8",       // Giz Pastel (Soft chalk mist)
  sky: "#7EB2DD",         // Azul Céu Pastel (Soft sky pastel)
  coral: "#E58A82",       // Coral Pastel (Muted coral pastel)
  mint: "#84CEAB",        // Menta Pastel (Soft mint seafoam pastel)
  lavender: "#BFA6DE",    // Lavanda Pastel (Soft lilac wisteria)
};

export const markerColors = {
  yellow: "#FDE68A",      // Ouro Iluminura (Parchment Gold pastel)
  green: "#BBF7D0",       // Verde Salgueiro (Soft Willow Green pastel)
  blue: "#BAE6FD",        // Azul Névoa (Morning Sky Mist pastel)
  pink: "#FBCFE8",        // Rosa Silvestre (Dusty Wild Rose pastel)
  orange: "#FED7AA",      // Damasco Âmbar (Muted Apricot pastel)
};

export const stickyNoteColors = {
  yellow: "#FEF08A",      // Post-it Amarelo Clássico
  pink: "#FBCFE8",        // Post-it Rosa Suave
  mint: "#BBF7D0",        // Post-it Menta
  sky: "#BAE6FD",         // Post-it Azul Céu
  amber: "#FED7AA",       // Post-it Pêssego
};

export const defaultStickyNoteColor = stickyNoteColors.yellow;

export const defaultPencilColor = pencilColors.graphite;
export const defaultMarkerColor = markerColors.yellow;

export const pencilWidths = {
  fine: 2.5,
  medium: 4,
  thick: 7,
};

export const markerWidths = {
  fine: 16,
  medium: 24,
  thick: 36,
};

export const defaultPencilWidth = pencilWidths.medium;
export const defaultMarkerWidth = markerWidths.medium;

export const pencilOpacity = 1.0;
export const markerOpacity = 0.5;
