import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Todo } from 'src/modules/todos/todos.entity'; // Pfad anpassen

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  // weitere Felder ...

  @OneToMany(() => Todo, todo => todo.user)
  todos: Todo[];
}
