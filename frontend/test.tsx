async function postData(payload : object): Promise<void> {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // The Flask endpoint currently returns plain text ("Test successful!")
        // so attempting to parse JSON will throw. Inspect the Content-Type
        // header and parse accordingly (JSON when available, otherwise text).
        const contentType = response.headers.get('content-type') || '';
        let data: any;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        console.log('POST Response:', data);
    } catch (error) {
        console.error('Error posting data:', error);
    }
}

postData({ name: 'TypeScript User', age: 30 });