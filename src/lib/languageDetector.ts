export const detectLanguage = (code: string): { language: string; extension: string; icon: string } => {
    const lower = code.toLowerCase();

    // Python
    if (/def\s+\w+\s*\(|import\s+numpy|import\s+pandas|from\s+fastapi|print\(/.test(lower)) {
        return { language: 'python', extension: 'py', icon: '🐍' };
    }

    // TypeScript / React
    if (/import\s+react|interface\s+\w+|const\s+\w+\s*:\s*react\.fc|export\s+default\s+function/.test(lower)) {
        return { language: 'typescript', extension: 'tsx', icon: '⚛' };
    }

    // JavaScript
    if (/console\.log|const\s+require\s*=|module\.exports/.test(lower)) {
        return { language: 'javascript', extension: 'js', icon: '🟨' };
    }

    // CSS
    if (/\.[a-z-]+\s*\{|@media|:root/.test(lower)) {
        return { language: 'css', extension: 'css', icon: '🎨' };
    }

    // HTML
    if (/<!doctype html>|<html|<div/.test(lower)) {
        return { language: 'html', extension: 'html', icon: '🌐' };
    }

    // SQL
    if (/select\s+\*\s+from|insert\s+into|create\s+table/.test(lower)) {
        return { language: 'sql', extension: 'sql', icon: '🐘' };
    }

    // JSON
    if (/^\s*[\{\[]/.test(lower) && (code.includes(':') || code.includes('"'))) {
        try {
            JSON.parse(code);
            return { language: 'json', extension: 'json', icon: '📋' };
        } catch (e) { }
    }

    return { language: 'typescript', extension: 'tsx', icon: '⚛' }; // Default
};
