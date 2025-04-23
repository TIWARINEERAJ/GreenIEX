import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class RECertificate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  generatorId: string;

  @Column({
    type: "enum",
    enum: ["SOLAR", "WIND", "HYDRO"],
  })
  energyType: string;

  @Column("decimal", { precision: 10, scale: 2 })
  mwhQuantity: number;

  @CreateDateColumn()
  generationDate: Date;

  @Column()
  expiryDate: Date;

  @Column({ default: false })
  isRetired: boolean;

  @Column("decimal", { precision: 10, scale: 2 })
  carbonOffset: number;

  @Column({ nullable: true })
  currentOwnerId: string;
}
