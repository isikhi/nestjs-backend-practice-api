import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHost: ArgumentsHost;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({ url: '/test-url' });
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as any;
    loggerErrorSpy = jest
      .spyOn((filter as any).logger, 'error')
      .mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('should catch HTTP exceptions and format response', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-url',
      }),
    );
  });

  it('should handle CastError as 400 Bad Request', () => {
    const castError = {
      name: 'CastError',
      kind: 'ObjectId',
      message: 'Cast failed',
    };

    filter.catch(castError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        context: { error: 'Invalid identifier format' },
      }),
    );
  });

  it('should handle unknown errors as 500 Internal Server Error', () => {
    const unknownError = new Error('Unexpected error');

    filter.catch(unknownError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        context: { error: 'Internal server error' },
      }),
    );
  });

  it('should log all exceptions', () => {
    const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost);
    expect(loggerErrorSpy).toHaveBeenCalled();
    const callArgs = loggerErrorSpy.mock.calls[0] || [];
    expect(callArgs[0]).toMatch(
      /Unhandled exception caught by AllExceptionsFilter/,
    );
    expect(typeof callArgs[1]).toBe('string');
  });

  it('should include timestamp', () => {
    const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
    const before = new Date().toISOString();

    filter.catch(exception, mockHost);

    const callArg = mockJson.mock.calls[0][0];
    expect(callArg.timestamp).toBeDefined();
    expect(new Date(callArg.timestamp).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );
  });
});
