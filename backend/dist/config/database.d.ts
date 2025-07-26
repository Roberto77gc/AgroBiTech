declare class DatabaseConnection {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): DatabaseConnection;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionStatus(): boolean;
}
export declare const database: DatabaseConnection;
export {};
//# sourceMappingURL=database.d.ts.map