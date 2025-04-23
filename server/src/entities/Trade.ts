import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./Order";
import { RECertificate } from "./RECertificate";

@Entity()
export class Trade {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  buyOrderId: string;

  @Column()
  sellOrderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: "buyOrderId" })
  buyOrder: Order;

  @ManyToOne(() => Order)
  @JoinColumn({ name: "sellOrderId" })
  sellOrder: Order;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;

  @Column({ nullable: true })
  recCertificateId: string;

  @ManyToOne(() => RECertificate, { nullable: true })
  @JoinColumn({ name: "recCertificateId" })
  recCertificate: RECertificate;

  @Column("decimal", { precision: 10, scale: 2 })
  carbonOffset: number;

  @CreateDateColumn()
  executedAt: Date;
}
