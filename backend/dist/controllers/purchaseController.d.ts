import { Request, Response } from 'express';
export declare const getPurchases: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPurchasesByProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPurchasesBySupplier: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPurchase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePurchase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePurchase: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=purchaseController.d.ts.map