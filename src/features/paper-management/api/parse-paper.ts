import { AxiosProgressEvent } from 'axios';

import { ParsePaperResponse } from '../types';

// TODO: Replace with real API call when backend parse endpoint is updated
export const parsePaperFile = (
  _file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  signal?: AbortSignal,
): Promise<ParsePaperResponse> => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const abortHandler = () => {
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', abortHandler);

    // Simulate upload progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 20;
      if (progress > 100) progress = 100;
      onUploadProgress?.({
        loaded: progress,
        total: 100,
        bytes: progress,
        progress: progress / 100,
        estimated: 0,
        rate: 0,
        upload: true,
        download: false,
        event: {} as ProgressEvent,
        lengthComputable: true,
      } as AxiosProgressEvent);
      if (progress >= 100) clearInterval(progressInterval);
    }, 200);

    // Simulate parse delay then return mock response
    setTimeout(() => {
      clearInterval(progressInterval);
      signal?.removeEventListener('abort', abortHandler);

      resolve({
        parsedText:
          'Abstract: This is the abstract section of the mock parsed paper. It contains a brief overview of the research.\n\n' +
          '1. Introduction: This section introduces the research problem and provides background context for the study.\n\n' +
          '2. Methodology: The methodology section describes the research methods, data collection, and analysis techniques used.\n\n' +
          '3. Results: Results and findings from the research are presented in this section with supporting data.\n\n' +
          '4. Discussion: This section discusses the implications of the findings and compares them with previous work.\n\n' +
          '5. Conclusion: The conclusion summarizes the key findings and suggests directions for future research.',
        tags: ['research', 'methodology', 'analysis'],
      });
    }, 1500);
  });
};
