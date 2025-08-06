import { Request, Response } from 'express';
export declare const getInventoryItems: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInventoryItemById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createInventoryItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateInventoryItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteInventoryItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const adjustStock: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAlerts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markAlertAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=inventoryController.d.ts.map