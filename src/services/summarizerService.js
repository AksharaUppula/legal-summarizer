import { pipeline } from '@xenova/transformers';

class SummarizerService {
    constructor() {
        this.pipeline = null;
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            try {
                this.pipeline = await pipeline('summarization', 'Xenova/bart-large-cnn');
                this.initialized = true;
            } catch (error) {
                console.error('Error initializing BART model:', error);
                throw error;
            }
        }
    }

    async summarize(text, maxLength = 150, minLength = 30) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const result = await this.pipeline(text, {
                max_length: maxLength,
                min_length: minLength,
                do_sample: false,
            });

            return result[0].summary_text;
        } catch (error) {
            console.error('Error during summarization:', error);
            throw error;
        }
    }
}

export const summarizerService = new SummarizerService(); 