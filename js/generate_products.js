const fs = require('fs');
const path = require('path');

const baseDir = '/Users/fiona/MINE/01_Code_Projects/Yeshere.cn/Distributed_Products';
const docsDir = '/Users/fiona/MINE/01_Code_Projects/Yeshere.cn/documents';
const products = [];

const folders = fs.readdirSync(baseDir);

folders.forEach(folder => {
    const folderPath = path.join(baseDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) return;

    const files = fs.readdirSync(folderPath);
    const images = files.filter(f => f.endsWith('.png'));
    const txts = files.filter(f => f.endsWith('.txt'));
    
    // Create structured sections
    const sections = [];
    
    // Sort txts to put main description first if possible
    txts.sort((a, b) => {
        const mainKeywords = ['description', folder.toLowerCase(), 'simple_dsp_board'];
        const aIsMain = mainKeywords.some(k => a.toLowerCase().includes(k));
        const bIsMain = mainKeywords.some(k => b.toLowerCase().includes(k));
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        return 0;
    });

    txts.forEach(txtFile => {
        const content = fs.readFileSync(path.join(folderPath, txtFile), 'utf8');
        const title = txtFile.replace('.txt', '').replace(/_/g, ' ');
        
        // Try to find a matching image for this section
        const keywords = title.toLowerCase().split(' ').filter(k => k.length > 2);
        const sectionImage = images.find(img => {
            const imgLower = img.toLowerCase();
            // Lenient matching: check if most keywords match, or handle common typos
            const matches = keywords.filter(k => imgLower.includes(k) || (k === 'pofessional' && imgLower.includes('professional')));
            return matches.length >= Math.min(keywords.length, 2) && !imgLower.includes('main');
        });

        sections.push({
            title: title,
            content: content,
            image: sectionImage || null
        });
    });

    // If no sections were created but images exist, create a default section with the first image
    if (sections.length === 0 && images.length > 0) {
        sections.push({
            title: folder,
            content: "暂无详细技术描述。",
            image: images[0]
        });
    }

    const packageKeywords = ['LQFP', 'BGA', 'SOIC', 'LFGA', 'QFN', 'SSOP'];
    const packages = images
        .filter(img => img.includes('-'))
        .map(img => img.split('-').pop().replace('.png', '').trim())
        .filter(p => packageKeywords.some(key => p.toUpperCase().includes(key))); 

    const docName = folder.toLowerCase().replace(/ /g, '');
    const isChip = /^vs\d{4}$/i.test(folder.trim()) || folder.toLowerCase() === 'vs23s010' || folder.toLowerCase() === 'vs8053';
    const hasNonChipKeywords = /board|kit|player|application|recorder|eliminator|proto/i.test(folder);
    
    let docFile = null;
    if (isChip && !hasNonChipKeywords) {
        docFile = fs.readdirSync(docsDir).find(d => d.toLowerCase().startsWith(docName.substring(0, 6)));
    }

    products.push({
        id: folder.replace(/ /g, '_'),
        name: folder,
        folder: folder,
        images: images,
        sections: sections,
        packages: [...new Set(packages)],
        document: docFile ? docFile : null
    });
});

console.log(JSON.stringify(products, null, 2));
