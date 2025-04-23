import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: ["SOLAR", "WIND", "HYDRO"],
  })
  energyType: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;

  @Column({
    type: "enum",
    enum: ["BUY", "SELL"],
  })
  orderType: string;

  @Column({ default: false })
  recAttached: boolean;

  @Column({
    type: "enum",
    enum: ["PENDING", "MATCHED", "CANCELLED"],
    default: "PENDING",
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
