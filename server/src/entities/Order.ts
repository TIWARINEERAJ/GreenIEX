import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

// Order types
export enum OrderType {
  BUY = 'buy',
  SELL = 'sell'
}

// Order status
export enum OrderStatus {
  OPEN = 'open',
  PARTIALLY_FILLED = 'partially_filled',
  FILLED = 'filled',
  CANCELLED = 'cancelled'
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: ["SOLAR", "WIND", "HYDRO", "REC", "CARBON_CREDIT"],
  })
  energyType: string;
  
  // Alias for energyType to make it compatible with the matching engine
  get assetType(): string {
    return this.energyType;
  }
  
  set assetType(value: string) {
    this.energyType = value;
  }

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;
  
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  filledQuantity: number;

  @Column({
    type: "enum",
    enum: OrderType,
    default: OrderType.BUY
  })
  orderType: OrderType;
  
  // Alias for orderType to make it compatible with the matching engine
  get type(): OrderType {
    return this.orderType;
  }
  
  set type(value: OrderType) {
    this.orderType = value;
  }

  @Column({ default: false })
  recAttached: boolean;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.OPEN
  })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
