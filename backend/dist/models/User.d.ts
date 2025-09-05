import mongoose, { Document } from 'mongoose';
interface IUser extends Document {
    _id: string;
    email: string;
    name: string;
    password: string;
    resetPasswordToken?: string | undefined;
    resetPasswordExpires?: Date | undefined;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=User.d.ts.map