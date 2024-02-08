export async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        // console.log('Received data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        // throw error; // Rethrow error for handling outside of this function
    }
}