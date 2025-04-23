import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class CarbonCredit {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  tradeId: string;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: "enum",
    enum: ["SOLAR", "WIND", "HYDRO"],
  })
  sourceType: string;

  @CreateDateColumn()
  generatedAt: Date;

  @Column()
  expiryDate: Date;

  @Column({ default: false })
  isRetired: boolean;

  @Column({ nullable: true })
  retirementReason: string;
}
