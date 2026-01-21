const regex = /\{[^}]*\}/g;
export function stripTags(str) {
    // Replace all occurrences of the pattern with an empty string
    return str.replace(regex, '');
}
//# sourceMappingURL=stripTags.js.map