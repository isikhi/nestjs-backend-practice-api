import { RequestIdInterceptor } from './request-id.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('RequestIdInterceptor', () => {
  let interceptor: RequestIdInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new RequestIdInterceptor();

    mockRequest = {
      headers: {},
      method: 'GET',
      url: '/test',
    };

    mockResponse = {
      setHeader: jest.fn(),
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('test')),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should generate request id when header not present', (done) => {
    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe(() => {
        expect(mockRequest.id).toBeDefined();
        expect(typeof mockRequest.id).toBe('string');
        expect(mockRequest.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        ); // UUID v4 format
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'X-Request-Id',
          mockRequest.id,
        );
        done();
      });
  });

  it('should use existing request id from header', (done) => {
    const existingId = 'existing-request-id-123';
    mockRequest.headers['x-request-id'] = existingId;

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe(() => {
        expect(mockRequest.id).toBe(existingId);
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'X-Request-Id',
          existingId,
        );
        done();
      });
  });

  it('should call next.handle() and pass through the result', (done) => {
    const expectedResult = 'test-result';
    mockCallHandler.handle = jest.fn().mockReturnValue(of(expectedResult));

    interceptor
      .intercept(mockExecutionContext, mockCallHandler)
      .subscribe((result) => {
        expect(result).toBe(expectedResult);
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
  });
});
