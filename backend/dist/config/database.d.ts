import mongoose from 'mongoose';
export declare class DatabaseConnection {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): DatabaseConnection;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionStatus(): boolean;
    getCollection(collectionName: string): mongoose.mongo.Collection<mongoose.mongo.BSON.Document>;
}
//# sourceMappingURL=database.d.ts.map