document.addEventListener('DOMContentLoaded', () => {
    const pdfInput = document.getElementById('pdfInput');
    const showPdfButton = document.getElementById('showPdf');
    const voiceSearchButton = document.getElementById('voiceSearch');
    const pdfViewer = document.getElementById('pdfViewer');
    let pdfDoc = null;
    let pdfUrl = '';
    let scale = 1.5;

    // Load the PDF
    pdfInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (e) => {
                pdfUrl = e.target.result;
                loadPdf(pdfUrl);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please upload a valid PDF file.');
        }
    });

    // Show the PDF
    showPdfButton.addEventListener('click', () => {
        if (pdfUrl) {
            loadPdf(pdfUrl);
        } else {
            alert('Please upload a PDF file first.');
        }
    });

    // Initialize voice search
    voiceSearchButton.addEventListener('click', () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Your browser does not support speech recognition.');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
            const keyword = event.results[0][0].transcript.trim();
            searchInPdf(keyword);
        };
        recognition.onerror = (event) => {
            alert('Error occurred in recognition: ' + event.error);
        };
        recognition.start();
    });

    document.write(keyword);

    // Load PDF into viewer
    function loadPdf(url) {
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then((pdf) => {
            pdfDoc = pdf;
            renderPage(1);
        }, (reason) => {
            console.error(reason);
        });
    }

    // Render a specific page
    function renderPage(pageNumber) {
        pdfDoc.getPage(pageNumber).then((page) => {
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            page.render(renderContext).promise.then(() => {
                pdfViewer.innerHTML = '';
                pdfViewer.appendChild(canvas);
            });
        });
    }

    // Showing the keyword
    function keyword_showing(keyword) {
        keywordDisplay.textContent = `Searched Keyword: "${keyword}"`;
        keywordDisplay.style.display = 'block';
    }

    // Search for a keyword in the PDF
    function searchInPdf(keyword) {
        if (!pdfDoc) {
            alert('Please load a PDF file first.');
            return;
        }

        const numPages = pdfDoc.numPages;
        const keywordLowerCase = keyword.toLowerCase();

        const searchPromises = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            searchPromises.push(
                pdfDoc.getPage(pageNum).then(page =>
                    page.getTextContent().then(textContent => {
                        const text = textContent.items.map(item => item.str).join(' ').toLowerCase();
                        if (text.includes(keywordLowerCase)) {
                            return { pageNum, found: true, page, textContent };
                        }
                        return { pageNum, found: false };
                    })
                )
            );
        }

        Promise.all(searchPromises).then(results => {
            const foundPage = results.find(result => result.found);
            if (foundPage) {
                keyword_showing(keyword);
                alert(`Keyword found on page ${foundPage.pageNum}`);
                renderPageWithHighlight(foundPage.pageNum, foundPage.page, foundPage.textContent, keywordLowerCase);
            } else {
                keyword_showing(keyword);
                alert('Keyword not found.');
            }
        }).catch(error => {
            console.error('Error searching through PDF:', error);
        });
    }

    function renderPageWithHighlight(pageNumber, page, textContent, keyword) {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        page.render(renderContext).promise.then(() => {
            highlightText(canvas, textContent, keyword);
            pdfViewer.innerHTML = '';
            pdfViewer.appendChild(canvas);
        });
    }

    function highlightText(canvas, textContent, keyword) {
        const context = canvas.getContext('2d');

        textContent.items.forEach((item) => {
            if (item.str.toLowerCase().includes(keyword)) {
                const x = item.transform[4];
                const y = canvas.height - item.transform[5];
                context.fillStyle = 'rgba(255, 0, 0, 0.3)';
                context.fillRect(x, y - item.height, item.width, item.height);
            }
        });
    }
});
